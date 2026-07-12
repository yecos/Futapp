import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { AdminPaymentsView } from '@/components/payments/admin-payments-view'

export default async function AdminPagosPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (!session.user.teamId) redirect('/choose-team')
  if (session.user.role !== 'ADMIN') redirect('/')

  const teamId = session.user.teamId

  const { data: payments } = await supabase
    .from('Payment')
    .select(`
      *,
      receipts:PaymentReceipt(
        *,
        player:Player(id, fullName, jerseyNumber)
      )
    `)
    .eq('teamId', teamId)
    .order('dueDate', { ascending: false })

  const { data: players } = await supabase
    .from('Player')
    .select('id, fullName, jerseyNumber, primaryPosition')
    .eq('teamId', teamId)
    .order('jerseyNumber', { ascending: true })

  const paymentsList = (payments || []).map((p: any) => ({
    ...p,
    amount: Number(p.amount),
    receipts: (p.receipts || []).map((r: any) => ({
      ...r,
      amount: r.amount ? Number(r.amount) : null,
    })),
  }))

  const totalRecaudado = paymentsList
    .flatMap((p) => p.receipts)
    .filter((r) => r.status === 'VERIFICADO')
    .reduce((sum, r) => sum + (r.amount || 0), 0)

  const pendientesVerificacion = paymentsList
    .flatMap((p) => p.receipts)
    .filter((r) => r.status === 'PAGADO').length

  return (
    <AdminPaymentsView
      payments={paymentsList}
      players={players || []}
      totalRecaudado={totalRecaudado}
      pendientesVerificacion={pendientesVerificacion}
    />
  )
}
