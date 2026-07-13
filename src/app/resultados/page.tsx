import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { ResultsView } from '@/components/views/results'

export default async function ResultadosPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { data: memberships } = await supabase
    .from('TeamMembership')
    .select('teamId')
    .eq('userId', session.user.id)
    .eq('status', 'ACTIVO')
    .limit(1)

  if (!memberships?.[0]?.teamId) redirect('/choose-team')

  const { data: matches } = await supabase
    .from('Event')
    .select('*')
    .eq('teamId', memberships[0].teamId)
    .eq('type', 'PARTIDO')
    .eq('status', 'COMPLETADO')
    .order('date', { ascending: false })

  const { data: stats } = await supabase
    .from('MatchStat')
    .select('*, player:Player(fullName, jerseyNumber)')
    .eq('teamId', memberships[0].teamId)

  return <ResultsView matches={matches || []} stats={stats || []} />
}
