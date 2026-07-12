import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { AdminPaymentsView } from '@/components/payments/admin-payments-view'

export default async function AdminPagosPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/')

  const teamId = session.user.teamId!

  // Cargar pagos con receipts
  const payments = await db.payment.findMany({
    where: { teamId },
    include: {
      receipts: {
        include: {
          player: { select: { id: true, fullName: true, jerseyNumber: true } },
        },
      },
    },
    orderBy: { dueDate: 'desc' },
  })

  const players = await db.player.findMany({
    where: { teamId },
    select: { id: true, fullName: true, jerseyNumber: true, primaryPosition: true },
    orderBy: { jerseyNumber: 'asc' },
  })

  // Calcular métricas
  const totalRecaudado = payments
    .flatMap((p) => p.receipts)
    .filter((r) => r.status === 'VERIFICADO')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0)

  const pendientesVerificacion = payments
    .flatMap((p) => p.receipts)
    .filter((r) => r.status === 'PAGADO').length

  const paymentsSerialized = payments.map((p) => ({
    ...p,
    amount: Number(p.amount),
    receipts: p.receipts.map((r) => ({
      ...r,
      amount: r.amount ? Number(r.amount) : null,
    })),
  }))

  return (
    <AdminPaymentsView
      payments={paymentsSerialized}
      players={players}
      totalRecaudado={totalRecaudado}
      pendientesVerificacion={pendientesVerificacion}
    />
  )
}
