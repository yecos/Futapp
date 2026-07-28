import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { MembersManagerView } from '@/components/admin/members-manager-view'

export default async function AdminMiembrosPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Verificar rol desde DB (no del JWT que puede estar desactualizado)
  const myMembership = await db.teamMembership.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVO',
    },
    orderBy: { joinedAt: 'desc' },
    select: { role: true, teamId: true },
  })

  if (!myMembership?.teamId) redirect('/choose-team')
  if (myMembership.role !== 'ADMIN') redirect('/')

  const teamId = myMembership.teamId

  const [allMemberships, invites] = await Promise.all([
    db.teamMembership.findMany({
      where: { teamId },
      include: { user: { select: { id: true, email: true, name: true, image: true, phoneNumber: true } } },
      orderBy: { status: 'asc' },
    }),
    db.inviteToken.findMany({
      where: {
        teamId,
        usedBy: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return <MembersManagerView memberships={allMemberships as any} invites={invites as any} />
}
