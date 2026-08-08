import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { MyApplicationsClient } from '@/components/marketplace/my-applications-client'

export default async function MisPostulacionesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const freePlayer = await db.freePlayer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!freePlayer) {
    redirect('/registro-jugador-libre')
  }

  const applications = await db.application.findMany({
    where: { freePlayerId: freePlayer.id },
    include: {
      opening: {
        include: {
          team: { select: { id: true, name: true, shortName: true, primaryColor: true, category: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return <MyApplicationsClient applications={applications as any} />
}
