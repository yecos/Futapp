import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { MembersManagerView } from '@/components/admin/members-manager-view'

export default async function AdminMiembrosPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/')

  const teamId = session.user.teamId!

  const { data: memberships } = await supabase
    .from('TeamMembership')
    .select(`
      *,
      user:User(id, email, name, image, phoneNumber)
    `)
    .eq('teamId', teamId)
    .order('status', { ascending: true })

  const { data: invites } = await supabase
    .from('InviteToken')
    .select('*')
    .eq('teamId', teamId)
    .is('usedBy', null)
    .gt('expiresAt', new Date().toISOString())
    .order('createdAt', { ascending: false })

  return <MembersManagerView memberships={memberships || []} invites={invites || []} />
}
