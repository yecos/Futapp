import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { PlayerPaymentsView } from '@/components/payments/player-payments-view'

export default async function PagosPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (!session.user.teamId) redirect('/choose-team')
  if (session.user.membershipStatus === 'PENDIENTE') redirect('/pending')

  const teamId = session.user.teamId
  const team = await db.team.findUnique({
    where: { id: teamId },
    select: {
      name: true,
      shortName: true,
      bankName: true,
      accountType: true,
      accountNumber: true,
      accountHolder: true,
      qrImageUrl: true,
      paymentInstructions: true,
    },
  })

  if (!team) redirect('/choose-team')

  return <PlayerPaymentsView team={team as any} />
}
