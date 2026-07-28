import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { PlayerProfile } from '@/components/views/player-profile'

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { id } = await params

  // Verificar membership
  const membership = await db.teamMembership.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVO',
    },
    orderBy: { joinedAt: 'desc' },
    select: { teamId: true, role: true },
  })

  if (!membership?.teamId) redirect('/choose-team')

  // Obtener jugador
  const player = await db.player.findFirst({
    where: { id, teamId: membership.teamId },
  })

  if (!player) redirect('/plantilla')

  // Obtener stats de partidos del jugador
  const matchStats = await db.matchStat.findMany({
    where: { playerId: id },
    include: {
      event: {
        select: { title: true, date: true, opponent: true, isHome: true, homeScore: true, awayScore: true },
      },
    },
    orderBy: { event: { date: 'desc' } },
  })

  return <PlayerProfile player={player as any} matchStats={matchStats as any} userRole={membership.role} />
}
