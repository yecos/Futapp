import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { MyCardClient } from '@/components/free-player/my-card-client'

export default async function MiCartaPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const freePlayer = await db.freePlayer.findUnique({
    where: { userId: session.user.id },
    include: {
      testResults: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!freePlayer) {
    redirect('/registro-jugador-libre')
  }

  return <MyCardClient freePlayer={freePlayer as any} />
}
