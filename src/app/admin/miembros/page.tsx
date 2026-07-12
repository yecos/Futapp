import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { MembersManagerView } from '@/components/admin/members-manager-view'

export default async function AdminMiembrosPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/')

  const teamId = session.user.teamId!

  // Cargar membershps con user
  const memberships = await db.teamMembership.findMany({
    where: { teamId },
    include: {
      user: {
        select: { id: true, email: true, name: true, image: true, phoneNumber: true },
      },
    },
    orderBy: [{ status: 'asc' }, { joinedAt: 'asc' }],
  })

  // Cargar invites activos
  const invites = await db.inviteToken.findMany({
    where: { teamId, usedBy: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  return <MembersManagerView memberships={memberships} invites={invites} />
}
