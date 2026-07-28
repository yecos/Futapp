import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Consultar teamId directamente desde la DB
    const membership = await db.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVO',
      },
      orderBy: { joinedAt: 'desc' },
      select: { teamId: true, role: true },
    })

    const teamId = membership?.teamId
    if (!teamId) {
      return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })
    }

    const now = new Date()

    const [totalPlayers, totalEvents, nextEvents, topScorers, totalPayments, verifiedReceipts, recentMatches] = await Promise.all([
      db.player.count({ where: { teamId } }),
      db.event.count({
        where: { teamId, date: { gte: now }, status: 'PROGRAMADO' },
      }),
      db.event.findMany({
        where: { teamId, date: { gte: now }, status: 'PROGRAMADO' },
        select: { title: true, date: true, location: true, type: true },
        orderBy: { date: 'asc' },
        take: 1,
      }),
      db.player.findMany({
        where: { teamId },
        select: { fullName: true, goals: true, jerseyNumber: true },
        orderBy: { goals: 'desc' },
        take: 1,
      }),
      db.payment.count({ where: { teamId, status: 'PENDIENTE' } }),
      db.paymentReceipt.findMany({
        where: { teamId, status: 'VERIFICADO' },
        select: { amount: true },
      }),
      db.event.findMany({
        where: { teamId, status: 'COMPLETADO', homeScore: { not: null } },
        select: { title: true, homeScore: true, awayScore: true, isHome: true },
        orderBy: { date: 'desc' },
        take: 3,
      }),
    ])

    const totalRecaudado = verifiedReceipts.reduce(
      (sum, r) => sum + Number(r.amount || 0), 0
    )

    const recentResults = recentMatches.map((m) => {
      const ourScore = m.isHome ? m.homeScore! : m.awayScore!
      const oppScore = m.isHome ? m.awayScore! : m.homeScore!
      return {
        title: m.title,
        homeScore: m.homeScore!,
        awayScore: m.awayScore!,
        isWin: ourScore > oppScore,
        isDraw: ourScore === oppScore,
      }
    })

    return NextResponse.json({
      totalPlayers,
      totalEvents,
      totalPayments,
      totalRecaudado,
      nextEvent: nextEvents[0] || null,
      topScorer: topScorers[0] || null,
      recentResults,
    })
  } catch (error: any) {
    console.error('[API dashboard] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
