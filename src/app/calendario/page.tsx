import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { CalendarView } from '@/components/views/calendar'

export default async function CalendarioPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { data: memberships } = await supabase
    .from('TeamMembership')
    .select('teamId')
    .eq('userId', session.user.id)
    .eq('status', 'ACTIVO')
    .limit(1)

  if (!memberships?.[0]?.teamId) redirect('/choose-team')

  const { data: events } = await supabase
    .from('Event')
    .select('*')
    .eq('teamId', memberships[0].teamId)
    .order('date', { ascending: true })

  return <CalendarView events={events || []} />
}
