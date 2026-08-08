import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { FreePlayerRegisterClient } from '@/components/free-player/register-client'

export default async function RegistroJugadorLibrePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Si ya tiene perfil de jugador libre, ir a mi-carta
  const existing = await db.freePlayer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (existing) {
    redirect('/mi-carta')
  }

  return <FreePlayerRegisterClient userName={session.user.name || ''} userEmail={session.user.email || ''} />
}
