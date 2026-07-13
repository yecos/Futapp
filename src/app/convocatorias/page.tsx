import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { CallupsView } from '@/components/views/callups'

export default async function ConvocatoriasPage() {
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
    .order('date', { ascending: true })

  const { data: players } = await supabase
    .from('Player')
    .select('*')
    .eq('teamId', memberships[0].teamId)
    .order('jerseyNumber', { ascending: true })

  return <CallupsView matches={matches || []} players={players || []} />
}
