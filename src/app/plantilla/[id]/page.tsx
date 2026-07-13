import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { PlayerProfile } from '@/components/views/player-profile'

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { id } = await params

  // Verificar membership
  const { data: memberships } = await supabase
    .from('TeamMembership')
    .select('teamId, role')
    .eq('userId', session.user.id)
    .eq('status', 'ACTIVO')
    .limit(1)

  const membership = memberships?.[0]
  if (!membership?.teamId) redirect('/choose-team')

  // Obtener jugador con stats de partidos
  const { data: player } = await supabase
    .from('Player')
    .select('*')
    .eq('id', id)
    .eq('teamId', membership.teamId)
    .single()

  if (!player) redirect('/plantilla')

  // Obtener stats de partidos del jugador
  const { data: matchStats } = await supabase
    .from('MatchStat')
    .select(`
      goals, assists, minutesPlayed, yellowCards, redCards, saves, shots, recoveries, isMotm,
      event:Event(title, date, opponent, isHome, homeScore, awayScore)
    `)
    .eq('playerId', id)
    .order('date', { ascending: false, foreignTable: 'Event' })

  return <PlayerProfile player={player} matchStats={matchStats || []} userRole={membership.role} />
}
