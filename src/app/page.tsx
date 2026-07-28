import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { DashboardView } from '@/components/views/dashboard'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Consultar membership directamente desde la DB
  const membership = await db.teamMembership.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVO',
    },
    orderBy: { joinedAt: 'desc' },
    include: { team: true },
  })

  // Si no tiene membership ACTIVO, verificar si tiene PENDIENTE
  if (!membership || !membership.teamId) {
    const pending = await db.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDIENTE',
      },
    })

    if (pending) {
      redirect('/pending')
    }
    redirect('/choose-team')
  }

  if (membership.role === 'ADMIN' && !membership.team.onboardingCompleted) {
    redirect('/onboarding')
  }

  const team = membership.team
  const teamId = membership.teamId

  // Fetch ALL dashboard data in parallel
  const now = new Date()

  const [
    totalPlayers,
    totalEvents,
    nextEvents,
    topScorers,
    totalPayments,
    verifiedReceipts,
    recentMatches,
  ] = await Promise.all([
    db.player.count({ where: { teamId } }),
    db.event.count({
      where: {
        teamId,
        date: { gte: now },
        status: 'PROGRAMADO',
      },
    }),
    db.event.findMany({
      where: {
        teamId,
        date: { gte: now },
        status: 'PROGRAMADO',
      },
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
    db.payment.count({
      where: { teamId, status: 'PENDIENTE' },
    }),
    db.paymentReceipt.findMany({
      where: { teamId, status: 'VERIFICADO' },
      select: { amount: true },
    }),
    db.event.findMany({
      where: {
        teamId,
        status: 'COMPLETADO',
        homeScore: { not: null },
      },
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

  const dashboardData = {
    totalPlayers,
    totalEvents,
    totalPayments,
    totalRecaudado,
    nextEvent: nextEvents[0] || undefined,
    topScorer: topScorers[0] || undefined,
    recentResults,
  }

  return (
    <DashboardView
      teamName={team.name}
      teamShortName={team.shortName}
      currentRole={membership.role}
      initialData={dashboardData}
    />
  )
}
