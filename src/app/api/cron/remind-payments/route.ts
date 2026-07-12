import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`
  if (authHeader !== expectedSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const now = new Date()
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  let stats = {
    paymentsChecked: 0,
    remindersSent: 0,
    paymentsMarkedVencido: 0,
  }

  try {
    const { data: pendingPayments } = await supabase
      .from('Payment')
      .select(`
        *,
        receipts:PaymentReceipt(status, playerId)
      `)
      .in('status', ['PENDIENTE', 'VENCIDO'])
      .lte('dueDate', in3Days.toISOString())

    stats.paymentsChecked = pendingPayments?.length || 0

    for (const payment of pendingPayments || []) {
      const applies = payment.appliesTo as string[]
      let playersQuery = supabase
        .from('Player')
        .select('id, userId, fullName')
        .eq('teamId', payment.teamId)

      if (applies && !applies.includes('ALL')) {
        playersQuery = playersQuery.in('id', applies)
      }

      const { data: players } = await playersQuery
      const pendingPlayers = (players || []).filter(
        (p: any) => !payment.receipts?.some((r: any) =>
          r.playerId === p.id && ['VERIFICADO', 'PAGADO'].includes(r.status)
        )
      )

      const dueDate = new Date(payment.dueDate)
      const diffMs = dueDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000))

      let title: string
      let body: string

      if (diffDays > 0 && diffDays <= 3) {
        title = `Recordatorio: ${payment.title}`
        body = `Faltan ${diffDays} día${diffDays === 1 ? '' : 's'}. Monto: $${Number(payment.amount).toLocaleString('es-CO')}`
      } else if (diffDays === 0) {
        title = `Vence hoy: ${payment.title}`
        body = `Hoy es la fecha límite. Monto: $${Number(payment.amount).toLocaleString('es-CO')}`
      } else if (diffDays < 0 && diffDays >= -7) {
        title = `Pago vencido: ${payment.title}`
        body = `Venció hace ${Math.abs(diffDays)} día${Math.abs(diffDays) === 1 ? '' : 's'}. Regulariza cuanto antes.`
      } else {
        if (payment.status !== 'VENCIDO') {
          await supabase
            .from('Payment')
            .update({ status: 'VENCIDO' })
            .eq('id', payment.id)
          stats.paymentsMarkedVencido++
        }
        continue
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const notificationsToCreate = []
      for (const player of pendingPlayers) {
        if (!player.userId) continue

        const { data: existing } = await supabase
          .from('Notification')
          .select('id')
          .eq('userId', player.userId)
          .eq('relatedEntityType', 'PAYMENT')
          .eq('relatedEntityId', payment.id)
          .eq('type', 'PAYMENT_REMINDER')
          .gte('sentAt', today.toISOString())
          .limit(1)

        if (existing && existing.length > 0) continue

        notificationsToCreate.push({
          teamId: payment.teamId,
          userId: player.userId,
          type: 'PAYMENT_REMINDER',
          title,
          body,
          channel: 'IN_APP',
          status: 'ENVIADA',
          sentAt: new Date().toISOString(),
          relatedEntityType: 'PAYMENT',
          relatedEntityId: payment.id,
        })
      }

      if (notificationsToCreate.length > 0) {
        await supabase.from('Notification').insert(notificationsToCreate)
        stats.remindersSent += notificationsToCreate.length
      }
    }

    return NextResponse.json({
      success: true,
      executedAt: now.toISOString(),
      stats,
    })
  } catch (error: any) {
    console.error('[Cron remind-payments] Error:', error)
    return NextResponse.json({ error: error.message, stats }, { status: 500 })
  }
}
