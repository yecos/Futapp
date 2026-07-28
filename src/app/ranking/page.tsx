import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { RankingView } from '@/components/views/ranking'

export default async function RankingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const membership = await db.teamMembership.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVO',
    },
    orderBy: { joinedAt: 'desc' },
    select: { teamId: true, role: true },
  })

  if (!membership?.teamId) redirect('/choose-team')

  const players = await db.player.findMany({
    where: { teamId: membership.teamId },
    select: {
      id: true, fullName: true, jerseyNumber: true, primaryPosition: true, photoUrl: true,
      statPoints: true, totalPointsEarned: true, streak: true, maxStreak: true,
      basePAC: true, baseSHO: true, basePAS: true, baseDRI: true, baseDEF: true, basePHY: true,
    },
    orderBy: { totalPointsEarned: 'desc' },
  })

  return <RankingView players={players as any} />
}
