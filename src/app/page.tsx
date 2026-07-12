import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { DashboardView } from '@/components/views/dashboard'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (session.user.membershipStatus === 'PENDIENTE') redirect('/pending')
  if (session.user.role === 'ADMIN' && !session.user.onboardingCompleted) {
    redirect('/onboarding')
  }

  const teamId = session.user.teamId!
  const team = await db.team.findUnique({ where: { id: teamId } })
  if (!team) redirect('/login')

  // Pasar datos básicos al cliente
  return <DashboardView teamName={team.name} teamShortName={team.shortName} />
}
