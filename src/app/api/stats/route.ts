import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, status: 'ACTIVO' },
      orderBy: { joinedAt: 'desc' },
      select: { teamId: true },
    })

    if (!membership?.teamId) {
      return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })
    }

    const teamId = membership.teamId

    const recentMatches = await db.event.findMany({
      where: { teamId, type: 'PARTIDO', status: 'COMPLETADO', homeScore: { not: null } },
      orderBy: { date: 'desc' },
      take: 10,
      select: { title: true, date: true, homeScore: true, awayScore: true, isHome: true },
    })

    const performanceByMatch = recentMatches.reverse().map((m) => {
      const our = m.isHome ? m.homeScore : m.awayScore
      const opp = m.isHome ? m.awayScore : m.homeScore
      const result = (our ?? 0) > (opp ?? 0) ? 'G' : (our ?? 0) === (opp ?? 0) ? 'E' : 'P'
      return {
        title: m.title.length > 12 ? m.title.substring(0, 12) + '…' : m.title,
        date: new Date(m.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
        our: our ?? 0, opp: opp ?? 0, result,
      }
    })

    const playersWithGoals = await db.player.findMany({
      where: { teamId, goals: { gt: 0 } },
      select: { fullName: true, goals: true, assists: true },
      orderBy: { goals: 'desc' },
      take: 8,
    })

    const goalsByPlayer = playersWithGoals.map((p) => ({
      name: p.fullName.split(' ')[0], fullName: p.fullName,
      goles: p.goals, asistencias: p.assists,
    }))

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const events = await db.event.findMany({
      where: { teamId, type: 'ENTRENAMIENTO', date: { gte: sixMonthsAgo } },
      select: { date: true },
    })

    const monthMap: Record<string, { total: number; attended: number }> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleDateString('es-CO', { month: 'short' })
      monthMap[key] = { total: 0, attended: 0 }
    }

    for (const ev of events) {
      const key = new Date(ev.date).toLocaleDateString('es-CO', { month: 'short' })
      if (monthMap[key]) monthMap[key].total++
    }

    const checkIns = await db.checkIn.findMany({
      where: { player: { teamId }, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    })

    for (const ci of checkIns) {
      const key = new Date(ci.createdAt).toLocaleDateString('es-CO', { month: 'short' })
      if (monthMap[key]) monthMap[key].attended++
    }

    const attendanceByMonth = Object.entries(monthMap).map(([month, data]) => ({
      month, entrenamientos: data.total, asistencias: data.attended,
    }))

    const playersByPosition = await db.player.groupBy({
      by: ['primaryPosition'],
      where: { teamId },
      _count: { id: true },
    })

    const positionDistribution = playersByPosition.map((p) => ({
      name: p.primaryPosition === 'PORTERO' ? 'Porteros' :
            p.primaryPosition === 'DEFENSA' ? 'Defensas' :
            p.primaryPosition === 'MEDIOCAMPISTA' ? 'Mediocampistas' : 'Delanteros',
      value: p._count.id,
    }))

    const totalMatches = recentMatches.length
    const wins = performanceByMatch.filter((p) => p.result === 'G').length
    const draws = performanceByMatch.filter((p) => p.result === 'E').length
    const losses = performanceByMatch.filter((p) => p.result === 'P').length
    const goalsFor = performanceByMatch.reduce((s, p) => s + p.our, 0)
    const goalsAgainst = performanceByMatch.reduce((s, p) => s + p.opp, 0)

    const verifiedReceipts = await db.paymentReceipt.findMany({
      where: { teamId, status: 'VERIFICADO', reviewedAt: { gte: sixMonthsAgo } },
      select: { amount: true, reviewedAt: true },
    })

    const paymentsByMonth: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleDateString('es-CO', { month: 'short' })
      paymentsByMonth[key] = 0
    }

    for (const r of verifiedReceipts) {
      if (!r.reviewedAt) continue
      const key = new Date(r.reviewedAt).toLocaleDateString('es-CO', { month: 'short' })
      if (key in paymentsByMonth) paymentsByMonth[key] += Number(r.amount || 0)
    }

    const revenueByMonth = Object.entries(paymentsByMonth).map(([month, amount]) => ({
      month, recaudado: amount,
    }))

    return NextResponse.json({
      performanceByMatch, goalsByPlayer, attendanceByMonth,
      positionDistribution, revenueByMonth,
      summary: {
        totalMatches, wins, draws, losses, goalsFor, goalsAgainst,
        winRate: totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0,
      },
    })
  } catch (error: any) {
    console.error('[API stats GET] Error:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
