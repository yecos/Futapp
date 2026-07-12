import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { DashboardView } from '@/components/views/dashboard'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Si no tiene teamId → /choose-team
  if (!session.user.teamId) redirect('/choose-team')

  // Si está pendiente → /pending
  if (session.user.membershipStatus === 'PENDIENTE') redirect('/pending')

  // Si es admin y no completó onboarding → /onboarding
  if (session.user.role === 'ADMIN' && !session.user.onboardingCompleted) {
    redirect('/onboarding')
  }

  const teamId = session.user.teamId
  const { data: team } = await supabase
    .from('Team')
    .select('name, shortName')
    .eq('id', teamId)
    .single()

  if (!team) redirect('/choose-team')

  return <DashboardView teamName={team.name} teamShortName={team.shortName} />
}
