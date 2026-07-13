import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { ChooseTeamClient } from '@/components/choose-team-client'

export default async function ChooseTeamPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // VERIFICAR DIRECTAMENTE EN LA DB si ya tiene membership
  // (no confiar en el JWT que puede estar desactualizado)
  const { data: memberships } = await supabase
    .from('TeamMembership')
    .select('role, status, teamId, team:Team(name, shortName, onboardingCompleted)')
    .eq('userId', session.user.id)
    .eq('status', 'ACTIVO')
    .order('joinedAt', { ascending: false })
    .limit(1)

  const membership = memberships?.[0]

  if (membership && membership.teamId) {
    // Ya tiene equipo → redirigir
    if (membership.role === 'ADMIN' && !(membership.team as any)?.onboardingCompleted) {
      redirect('/onboarding')
    }
    redirect('/')
  }

  // Verificar si tiene membership PENDIENTE
  const { data: pending } = await supabase
    .from('TeamMembership')
    .select('teamId')
    .eq('userId', session.user.id)
    .eq('status', 'PENDIENTE')
    .limit(1)

  if (pending && pending.length > 0) {
    redirect('/pending')
  }

  // No tiene equipo → mostrar pantalla de elegir
  return <ChooseTeamClient userName={session.user.name || ''} />
}
