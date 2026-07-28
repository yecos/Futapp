import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { AnnouncementsView } from '@/components/views/announcements'

export default async function AvisosPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const membership = await db.teamMembership.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVO',
    },
    orderBy: { joinedAt: 'desc' },
    select: { teamId: true },
  })

  if (!membership?.teamId) redirect('/choose-team')

  const announcements = await db.announcement.findMany({
    where: { teamId: membership.teamId },
    orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
  })

  return <AnnouncementsView announcements={announcements as any} />
}
