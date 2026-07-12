import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/cron/generate-recurring
 * Ejecutado el día 1 de cada mes a las 5am UTC.
 * Crea nuevos cobros para pagos recurrentes (mensuales).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`
  if (authHeader !== expectedSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    // Buscar pagos recurrentes mensuales originales (sin parentPaymentId)
    const recurringPayments = await db.payment.findMany({
      where: {
        recurrence: 'MENSUAL',
        parentPaymentId: null,
      },
    })

    const now = new Date()
    let created = 0

    for (const template of recurringPayments) {
      // Verificar si ya existe un pago generado para este mes
      const existingThisMonth = await db.payment.findFirst({
        where: {
          parentPaymentId: template.id,
          dueDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          },
        },
      })
      if (existingThisMonth) continue

      // Crear nuevo cobro con vence en 5 días
      const dueDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
      await db.payment.create({
        data: {
          teamId: template.teamId,
          title: template.title,
          description: template.description,
          type: template.type,
          amount: template.amount,
          dueDate,
          recurrence: 'MENSUAL',
          appliesTo: template.appliesTo,
          status: 'PENDIENTE',
          createdBy: template.createdBy,
          parentPaymentId: template.id,
        },
      })
      created++
    }

    return NextResponse.json({
      success: true,
      executedAt: now.toISOString(),
      recurringTemplates: recurringPayments.length,
      created,
    })
  } catch (error: any) {
    console.error('[Cron generate-recurring] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
