import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const isCron = req.headers.get('x-vercel-cron') === '1'
  if (!isCron && process.env.NODE_ENV === 'production') {
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
    const pendingPayments = await db.payment.findMany({
      where: {
        status: { in: ['PENDIENTE', 'VENCIDO'] },
        dueDate: { lte: in3Days },
      },
      include: {
        receipts: { select: { status: true, playerId: true } },
      },
    })

    stats.paymentsChecked = pendingPayments.length

    for (const payment of pendingPayments) {
      const applies = payment.appliesTo as string[]
      const playersWhere: any = { teamId: payment.teamId }
      if (applies && !applies.includes('ALL')) {
        playersWhere.id = { in: applies }
      }

      const players = await db.player.findMany({
        where: playersWhere,
        select: { id: true, userId: true, fullName: true },
      })

      const pendingPlayers = players.filter(
        (p) => !payment.receipts.some((r) =>
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
          await db.payment.update({
            where: { id: payment.id },
            data: { status: 'VENCIDO' },
          })
          stats.paymentsMarkedVencido++
        }
        continue
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const notificationsToCreate = []
      for (const player of pendingPlayers) {
        if (!player.userId) continue

        const existing = await db.notification.findFirst({
          where: {
            userId: player.userId,
            relatedEntityType: 'PAYMENT',
            relatedEntityId: payment.id,
            type: 'PAYMENT_REMINDER',
            sentAt: { gte: today },
          },
          select: { id: true },
        })

        if (existing) continue

        notificationsToCreate.push({
          teamId: payment.teamId,
          userId: player.userId,
          type: 'PAYMENT_REMINDER',
          title,
          body,
          channel: 'IN_APP',
          status: 'ENVIADA',
          sentAt: now,
          relatedEntityType: 'PAYMENT',
          relatedEntityId: payment.id,
        })
      }

      if (notificationsToCreate.length > 0) {
        await db.notification.createMany({ data: notificationsToCreate })
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
