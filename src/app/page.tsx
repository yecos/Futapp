import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { DashboardView } from '@/components/views/dashboard'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Consultar membership directamente desde la DB
  const { data: memberships } = await supabase
    .from('TeamMembership')
    .select('role, status, teamId, team:Team(name, shortName, onboardingCompleted)')
    .eq('userId', session.user.id)
    .eq('status', 'ACTIVO')
    .order('joinedAt', { ascending: false })
    .limit(1)

  const membership = memberships?.[0]

  // Si no tiene membership ACTIVO, verificar si tiene PENDIENTE
  if (!membership || !membership.teamId) {
    const { data: pending } = await supabase
      .from('TeamMembership')
      .select('teamId')
      .eq('userId', session.user.id)
      .eq('status', 'PENDIENTE')
      .limit(1)

    if (pending && pending.length > 0) {
      redirect('/pending')
    }
    redirect('/choose-team')
  }

  if (membership.role === 'ADMIN' && !(membership.team as any)?.onboardingCompleted) {
    redirect('/onboarding')
  }

  const team = membership.team as any
  if (!team) redirect('/choose-team')

  const teamId = membership.teamId

  // Fetch ALL dashboard data directly here (no API call needed)
  const now = new Date().toISOString()

  const [
    { count: totalPlayers },
    { count: totalEvents },
    { data: nextEvents },
    { data: topScorers },
    { count: totalPayments },
    { data: verifiedReceipts },
    { data: recentMatches },
  ] = await Promise.all([
    supabase.from('Player').select('*', { count: 'exact', head: true }).eq('teamId', teamId),
    supabase.from('Event').select('*', { count: 'exact', head: true }).eq('teamId', teamId).gte('date', now).eq('status', 'PROGRAMADO'),
    supabase.from('Event').select('title, date, location, type').eq('teamId', teamId).gte('date', now).eq('status', 'PROGRAMADO').order('date', { ascending: true }).limit(1),
    supabase.from('Player').select('fullName, goals, jerseyNumber').eq('teamId', teamId).order('goals', { ascending: false }).limit(1),
    supabase.from('Payment').select('*', { count: 'exact', head: true }).eq('teamId', teamId).eq('status', 'PENDIENTE'),
    supabase.from('PaymentReceipt').select('amount').eq('teamId', teamId).eq('status', 'VERIFICADO'),
    supabase.from('Event').select('title, homeScore, awayScore, isHome').eq('teamId', teamId).eq('status', 'COMPLETADO').not('homeScore', 'is', null).order('date', { ascending: false }).limit(3),
  ])

  const totalRecaudado = (verifiedReceipts || []).reduce(
    (sum: number, r: any) => sum + Number(r.amount || 0), 0
  )

  const recentResults = (recentMatches || []).map((m: any) => {
    const ourScore = m.isHome ? m.homeScore : m.awayScore
    const oppScore = m.isHome ? m.awayScore : m.homeScore
    return {
      title: m.title,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      isWin: ourScore > oppScore,
      isDraw: ourScore === oppScore,
    }
  })

  const dashboardData = {
    totalPlayers: totalPlayers || 0,
    totalEvents: totalEvents || 0,
    totalPayments: totalPayments || 0,
    totalRecaudado,
    nextEvent: nextEvents?.[0] || undefined,
    topScorer: topScorers?.[0] || undefined,
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
