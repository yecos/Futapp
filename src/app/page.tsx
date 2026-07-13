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

  // Sin team → choose-team
  if (!membership || !membership.teamId) redirect('/choose-team')

  // Pendiente → pending
  if (membership.status === 'PENDIENTE') redirect('/pending')

  // Admin sin onboarding → onboarding
  if (membership.role === 'ADMIN' && !(membership.team as any)?.onboardingCompleted) {
    redirect('/onboarding')
  }

  const team = membership.team as any
  if (!team) redirect('/choose-team')

  // Pasar el rol actual desde la DB (no del JWT que puede estar desactualizado)
  return <DashboardView teamName={team.name} teamShortName={team.shortName} currentRole={membership.role} />
}
