import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { CalendarView } from '@/components/views/calendar'

export default async function CalendarioPage() {
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

  const events = await db.event.findMany({
    where: { teamId: membership.teamId },
    orderBy: { date: 'asc' },
  })

  return <CalendarView events={events as any} />
}
