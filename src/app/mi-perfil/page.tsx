import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { MyProfileView } from '@/components/views/my-profile'

export default async function MiPerfilPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Buscar membership
  const { data: memberships } = await supabase
    .from('TeamMembership')
    .select('teamId, role')
    .eq('userId', session.user.id)
    .eq('status', 'ACTIVO')
    .limit(1)

  const membership = memberships?.[0]
  if (!membership?.teamId) redirect('/choose-team')

  // Buscar el perfil de jugador vinculado al user
  const { data: player } = await supabase
    .from('Player')
    .select('*')
    .eq('userId', session.user.id)
    .single()

  // Buscar el team para info
  const { data: team } = await supabase
    .from('Team')
    .select('name, shortName, primaryColor')
    .eq('id', membership.teamId)
    .single()

  return (
    <MyProfileView
      player={player}
      teamName={team?.name || ''}
      teamShortName={team?.shortName || ''}
      userRole={membership.role}
      userId={session.user.id}
      teamId={membership.teamId}
      userName={session.user.name || ''}
      userEmail={session.user.email || ''}
      userImage={session.user.image || null}
    />
  )
}
