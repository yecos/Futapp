import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { AnnouncementsView } from '@/components/views/announcements'

export default async function AvisosPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { data: memberships } = await supabase
    .from('TeamMembership')
    .select('teamId')
    .eq('userId', session.user.id)
    .eq('status', 'ACTIVO')
    .limit(1)

  if (!memberships?.[0]?.teamId) redirect('/choose-team')

  const { data: announcements } = await supabase
    .from('Announcement')
    .select('*')
    .eq('teamId', memberships[0].teamId)
    .order('pinned', { ascending: false })
    .order('publishedAt', { ascending: false })

  return <AnnouncementsView announcements={announcements || []} />
}
