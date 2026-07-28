import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { OnboardingView } from '@/components/onboarding/onboarding-view'

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Consultar membership directamente desde la DB
  const membership = await db.teamMembership.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVO',
    },
    orderBy: { joinedAt: 'desc' },
    include: { team: true },
  })

  if (!membership || !membership.teamId) {
    redirect('/choose-team')
  }

  if (membership.role !== 'ADMIN') {
    redirect('/')
  }

  if (membership.team.onboardingCompleted) {
    redirect('/')
  }

  return <OnboardingView teamId={membership.teamId} teamName={membership.team.name} />
}
