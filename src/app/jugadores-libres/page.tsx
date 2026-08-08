import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { PlayersDirectoryClient } from '@/components/marketplace/players-directory-client'

export default async function JugadoresLibresPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const players = await db.freePlayer.findMany({
    where: { isPublic: true },
    select: {
      id: true, fullName: true, age: true, photoUrl: true,
      primaryPosition: true, city: true, zone: true,
      bestVerticalJumpCm: true, bestSprint10Sec: true, bestSprint20Sec: true,
      createdAt: true,
    },
    orderBy: [
      { bestVerticalJumpCm: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 50,
  })

  return <PlayersDirectoryClient players={players as any} />
}
