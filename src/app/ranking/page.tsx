import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { RankingView } from '@/components/views/ranking'

export default async function RankingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { data: memberships } = await supabase
    .from('TeamMembership')
    .select('teamId, role')
    .eq('userId', session.user.id)
    .eq('status', 'ACTIVO')
    .limit(1)

  const membership = memberships?.[0]
  if (!membership?.teamId) redirect('/choose-team')

  const { data: players } = await supabase
    .from('Player')
    .select('id, fullName, jerseyNumber, primaryPosition, photoUrl, statPoints, totalPointsEarned, streak, maxStreak, basePAC, baseSHO, basePAS, baseDRI, baseDEF, basePHY')
    .eq('teamId', membership.teamId)
    .order('totalPointsEarned', { ascending: false })

  return <RankingView players={players || []} />
}
