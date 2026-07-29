import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { EventDetailClient } from '@/components/events/event-detail-client'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { id } = await params

  const event = await db.event.findUnique({
    where: { id },
    include: {
      attendances: {
        include: {
          player: {
            select: {
              id: true, fullName: true, jerseyNumber: true,
              primaryPosition: true, photoUrl: true, userId: true,
            },
          },
        },
        orderBy: { player: { jerseyNumber: 'asc' } },
      },
      callups: {
        include: {
          player: {
            select: {
              id: true, fullName: true, jerseyNumber: true,
              primaryPosition: true, photoUrl: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
      matchStats: {
        include: {
          player: { select: { id: true, fullName: true, jerseyNumber: true } },
        },
      },
      checkIns: {
        include: {
          player: { select: { id: true, fullName: true, jerseyNumber: true } },
        },
      },
    },
  })

  if (!event) redirect('/calendario')

  // Verificar acceso
  const membership = await db.teamMembership.findFirst({
    where: { userId: session.user.id, teamId: event.teamId, status: 'ACTIVO' },
    select: { role: true },
  })

  if (!membership) redirect('/calendario')

  // Buscar el player del usuario actual (si tiene)
  const myPlayer = await db.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  return (
    <EventDetailClient
      event={event as any}
      myRole={membership.role}
      myPlayerId={myPlayer?.id || null}
    />
  )
}
