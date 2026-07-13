import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  // Verificar que viene de Vercel Cron
  const isCron = req.headers.get('x-vercel-cron') === '1'
  if (!isCron && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { data: recurringPayments } = await supabase
      .from('Payment')
      .select('*')
      .eq('recurrence', 'MENSUAL')
      .is('parentPaymentId', null)

    const now = new Date()
    let created = 0

    for (const template of recurringPayments || []) {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

      const { data: existing } = await supabase
        .from('Payment')
        .select('id')
        .eq('parentPaymentId', template.id)
        .gte('dueDate', monthStart.toISOString())
        .lt('dueDate', monthEnd.toISOString())
        .limit(1)

      if (existing && existing.length > 0) continue

      const dueDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
      await supabase.from('Payment').insert({
        teamId: template.teamId,
        title: template.title,
        description: template.description,
        type: template.type,
        amount: template.amount,
        dueDate: dueDate.toISOString(),
        recurrence: 'MENSUAL',
        appliesTo: template.appliesTo,
        status: 'PENDIENTE',
        createdBy: template.createdBy,
        parentPaymentId: template.id,
      })
      created++
    }

    return NextResponse.json({
      success: true,
      executedAt: now.toISOString(),
      recurringTemplates: recurringPayments?.length || 0,
      created,
    })
  } catch (error: any) {
    console.error('[Cron generate-recurring] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
