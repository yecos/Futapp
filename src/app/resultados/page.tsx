import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { ResultsView } from '@/components/views/results'

export default async function ResultadosPage() {
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

  const [matches, stats] = await Promise.all([
    db.event.findMany({
      where: {
        teamId: membership.teamId,
        type: 'PARTIDO',
        status: 'COMPLETADO',
      },
      orderBy: { date: 'desc' },
    }),
    db.matchStat.findMany({
      where: { teamId: membership.teamId },
      include: { player: { select: { fullName: true, jerseyNumber: true } } },
    }),
  ])

  return <ResultsView matches={matches as any} stats={stats as any} />
}
