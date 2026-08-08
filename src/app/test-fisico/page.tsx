import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { TestsMenuClient } from '@/components/free-player/tests-menu-client'

export default async function TestFisicoPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const freePlayer = await db.freePlayer.findUnique({
    where: { userId: session.user.id },
    include: {
      testResults: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!freePlayer) {
    redirect('/registro-jugador-libre')
  }

  return <TestsMenuClient freePlayer={freePlayer as any} />
}
