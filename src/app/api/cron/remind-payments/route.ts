import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/cron/remind-payments
 * Ejecutado por Vercel Cron diariamente a las 9am UTC.
 * Requiere header Authorization: Bearer <CRON_SECRET>.
 *
 * Lógica:
 * 1. Busca pagos pendientes cuyo dueDate está a 3 días, hoy, o ya vencidos.
 * 2. Para cada pago, identifica jugadores aplicables que NO tengan receipt VERIFICADO.
 * 3. Crea notificaciones IN_APP (máximo 1 por día por pago-jugador).
 * 4. Si venció hace 7+ días, marca el Payment como VENCIDO.
 */
export async function GET(req: NextRequest) {
  // Verificar CRON_SECRET
  const authHeader = req.headers.get('authorization')
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`
  if (authHeader !== expectedSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const now = new Date()
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  let stats = {
    paymentsChecked: 0,
    remindersSent: 0,
    paymentsMarkedVencido: 0,
  }

  try {
    // Buscar todos los pagos pendientes o vencidos
    const pendingPayments = await db.payment.findMany({
      where: {
        status: { in: ['PENDIENTE', 'VENCIDO'] },
        dueDate: { lte: in3Days },
      },
      include: {
        receipts: {
          where: { status: { in: ['VERIFICADO', 'PAGADO'] } },
          select: { playerId: true, status: true },
        },
      },
    })

    stats.paymentsChecked = pendingPayments.length

    for (const payment of pendingPayments) {
      const applies = payment.appliesTo as string[]
      const players = applies && !applies.includes('ALL')
        ? await db.player.findMany({
            where: { id: { in: applies }, teamId: payment.teamId },
            select: { id: true, userId: true, fullName: true },
          })
        : await db.player.findMany({
            where: { teamId: payment.teamId },
            select: { id: true, userId: true, fullName: true },
          })

      // Filtrar jugadores que ya tienen receipt VERIFICADO o PAGADO
      const pendingPlayers = players.filter(
        (p) => !payment.receipts.some((r) => r.playerId === p.id)
      )

      // Calcular días hasta vencimiento
      const dueDate = new Date(payment.dueDate)
      const diffMs = dueDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000))

      let title: string
      let body: string
      if (diffDays > 0 && diffDays <= 3) {
        title = `Recordatorio: ${payment.title}`
        body = `Faltan ${diffDays} día${diffDays === 1 ? '' : 's'} para el vencimiento. Monto: $${Number(payment.amount).toLocaleString('es-CO')}`
      } else if (diffDays === 0) {
        title = `Vence hoy: ${payment.title}`
        body = `Hoy es la fecha límite de pago. Monto: $${Number(payment.amount).toLocaleString('es-CO')}`
      } else if (diffDays < 0 && diffDays >= -7) {
        title = `Pago vencido: ${payment.title}`
        body = `Tu pago venció hace ${Math.abs(diffDays)} día${Math.abs(diffDays) === 1 ? '' : 's'}. Regulariza cuanto antes.`
      } else {
        // diffDays < -7: marcar payment como VENCIDO y saltar notificación
        if (payment.status !== 'VENCIDO') {
          await db.payment.update({
            where: { id: payment.id },
            data: { status: 'VENCIDO' },
          })
          stats.paymentsMarkedVencido++
        }
        continue
      }

      // Para cada jugador pendiente, crear notificación si no se envió hoy
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const notificationsToCreate = []
      for (const player of pendingPlayers) {
        if (!player.userId) continue

        // Verificar si ya se envió notificación hoy para este pago-jugador
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
          channel: 'IN_APP' as const,
          status: 'ENVIADA' as const,
          sentAt: new Date(),
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
    return NextResponse.json(
      { error: error.message, stats },
      { status: 500 }
    )
  }
}
