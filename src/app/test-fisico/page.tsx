import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { VerticalJumpTestClient } from '@/components/free-player/vertical-jump-test'

export default async function TestFisicoPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Verificar que tiene perfil de jugador libre
  const freePlayer = await db.freePlayer.findUnique({
    where: { userId: session.user.id },
  })

  if (!freePlayer) {
    redirect('/registro-jugador-libre')
  }

  return <VerticalJumpTestClient freePlayerId={freePlayer.id} freePlayerName={freePlayer.fullName} />
}
