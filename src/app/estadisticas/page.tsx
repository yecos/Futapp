import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { StatsView } from '@/components/stats/stats-view'

export default async function EstadisticasPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const membership = await db.teamMembership.findFirst({
    where: { userId: session.user.id, status: 'ACTIVO' },
    orderBy: { joinedAt: 'desc' },
    select: { teamId: true },
  })

  if (!membership?.teamId) redirect('/choose-team')

  const team = await db.team.findUnique({
    where: { id: membership.teamId },
    select: { name: true, shortName: true },
  })

  return <StatsView teamName={team?.name || ''} teamShortName={team?.shortName || ''} />
}
