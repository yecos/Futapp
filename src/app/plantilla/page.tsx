import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { RosterView } from '@/components/views/roster'

export default async function PlantillaPage() {
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

  const players = await db.player.findMany({
    where: { teamId: membership.teamId },
    orderBy: { jerseyNumber: 'asc' },
  })

  return <RosterView players={players as any} />
}
