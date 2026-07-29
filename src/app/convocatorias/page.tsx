import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { CallupsView } from '@/components/views/callups'

export default async function ConvocatoriasPage() {
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

  const [matches, players] = await Promise.all([
    db.event.findMany({
      where: {
        teamId: membership.teamId,
        type: 'PARTIDO',
      },
      orderBy: { date: 'asc' },
    }),
    db.player.findMany({
      where: { teamId: membership.teamId },
      orderBy: { jerseyNumber: 'asc' },
    }),
  ])

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>}>
      <CallupsView matches={matches as any} players={players as any} />
    </Suspense>
  )
}
