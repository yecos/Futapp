import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { AdminOpeningsClient } from '@/components/marketplace/admin-openings-client'

export default async function AdminCuposPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const membership = await db.teamMembership.findFirst({
    where: { userId: session.user.id, status: 'ACTIVO' },
    orderBy: { joinedAt: 'desc' },
    select: { teamId: true, role: true },
  })

  if (!membership?.teamId) redirect('/choose-team')
  if (membership.role !== 'ADMIN') redirect('/')

  const [openings, team] = await Promise.all([
    db.opening.findMany({
      where: { teamId: membership.teamId },
      include: {
        _count: { select: { applications: true } },
        applications: {
          include: {
            freePlayer: {
              select: {
                id: true, fullName: true, age: true, photoUrl: true,
                primaryPosition: true, city: true,
                bestVerticalJumpCm: true, bestSprint10Sec: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.team.findUnique({
      where: { id: membership.teamId },
      select: { isPremium: true, name: true },
    }),
  ])

  return <AdminOpeningsClient openings={openings as any} teamName={team?.name || ''} isPremium={team?.isPremium || false} />
}
