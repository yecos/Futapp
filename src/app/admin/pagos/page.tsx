import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { AdminPaymentsView } from '@/components/payments/admin-payments-view'

export default async function AdminPagosPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Verificar rol desde DB
  const membership = await db.teamMembership.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVO',
    },
    orderBy: { joinedAt: 'desc' },
    select: { role: true, teamId: true },
  })

  if (!membership?.teamId) redirect('/choose-team')
  if (membership.role !== 'ADMIN') redirect('/')

  const teamId = membership.teamId

  const [payments, players] = await Promise.all([
    db.payment.findMany({
      where: { teamId },
      include: {
        receipts: {
          include: {
            player: { select: { id: true, fullName: true, jerseyNumber: true } },
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    }),
    db.player.findMany({
      where: { teamId },
      select: { id: true, fullName: true, jerseyNumber: true, primaryPosition: true },
      orderBy: { jerseyNumber: 'asc' },
    }),
  ])

  const paymentsList = payments.map((p) => ({
    ...p,
    amount: Number(p.amount),
    receipts: p.receipts.map((r) => ({
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
      payments={paymentsList as any}
      players={players as any}
      totalRecaudado={totalRecaudado}
      pendientesVerificacion={pendientesVerificacion}
    />
  )
}
