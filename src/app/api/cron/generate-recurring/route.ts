import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const isCron = req.headers.get('x-vercel-cron') === '1'
  if (!isCron && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const recurringPayments = await db.payment.findMany({
      where: {
        recurrence: 'MENSUAL',
        parentPaymentId: null,
      },
    })

    const now = new Date()
    let created = 0

    for (const template of recurringPayments) {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

      const existing = await db.payment.findFirst({
        where: {
          parentPaymentId: template.id,
          dueDate: { gte: monthStart, lt: monthEnd },
        },
        select: { id: true },
      })

      if (existing) continue

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
          appliesTo: template.appliesTo as any,
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
