import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { ChooseTeamClient } from '@/components/choose-team-client'

export default async function ChooseTeamPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // VERIFICAR DIRECTAMENTE EN LA DB si ya tiene membership
  const membership = await db.teamMembership.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVO',
    },
    orderBy: { joinedAt: 'desc' },
    include: { team: true },
  })

  if (membership && membership.teamId) {
    if (membership.role === 'ADMIN' && !membership.team.onboardingCompleted) {
      redirect('/onboarding')
    }
    redirect('/')
  }

  // Verificar si tiene membership PENDIENTE
  const pending = await db.teamMembership.findFirst({
    where: {
      userId: session.user.id,
      status: 'PENDIENTE',
    },
  })

  if (pending) {
    redirect('/pending')
  }

  // No tiene equipo → mostrar pantalla de elegir
  return <ChooseTeamClient userName={session.user.name || ''} />
}
