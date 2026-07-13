import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { OnboardingView } from '@/components/onboarding/onboarding-view'

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Consultar membership directamente desde la DB (no del JWT que puede estar desactualizado)
  const { data: membership } = await supabase
    .from('TeamMembership')
    .select('role, status, teamId, team:Team(*)')
    .eq('userId', session.user.id)
    .eq('status', 'ACTIVO')
    .single()

  if (!membership || !membership.teamId) {
    redirect('/choose-team')
  }

  if (membership.role !== 'ADMIN') {
    redirect('/')
  }

  const team = membership.team as any
  if (team?.onboardingCompleted) {
    redirect('/')
  }

  return <OnboardingView teamId={membership.teamId} teamName={team.name} />
}
