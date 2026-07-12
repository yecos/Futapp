import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { PlayerPaymentsView } from '@/components/payments/player-payments-view'

export default async function PagosPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (!session.user.teamId) redirect('/choose-team')
  if (session.user.membershipStatus === 'PENDIENTE') redirect('/pending')

  const teamId = session.user.teamId
  const { data: team } = await supabase
    .from('Team')
    .select(`
      name, shortName, bankName, accountType,
      accountNumber, accountHolder, qrImageUrl,
      paymentInstructions
    `)
    .eq('id', teamId)
    .single()

  if (!team) redirect('/login')

  return <PlayerPaymentsView team={team} />
}
