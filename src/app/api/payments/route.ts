import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'

const createPaymentSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  type: z.enum([
    'MENSUALIDAD', 'ARBITRAJE', 'UNIFORME', 'INSCRIPCION',
    'EVENTO', 'MULTA', 'OTRO',
  ]),
  amount: z.number().positive().max(100000000),
  dueDate: z.string().or(z.date()),
  recurrence: z.enum(['UNICO', 'MENSUAL', 'SEMESTRAL', 'ANUAL']).default('UNICO'),
  appliesTo: z.array(z.string()).default(['ALL']),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const teamId = session.user.teamId
    if (!teamId) return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const isPlayer = session.user.role === 'JUGADOR' || session.user.role === 'ACUDIENTE'
    const isAdmin = session.user.role === 'ADMIN'

    let currentPlayerId: string | undefined
    if (session.user.role === 'JUGADOR') {
      const { data: player } = await supabase
        .from('Player')
        .select('id')
        .eq('userId', session.user.id)
        .single()
      currentPlayerId = player?.id
    } else if (session.user.role === 'ACUDIENTE') {
      const { data: player } = await supabase
        .from('Player')
        .select('id')
        .eq('guardianId', session.user.id)
        .limit(1)
        .single()
      currentPlayerId = player?.id
    }

    let query = supabase
      .from('Payment')
      .select(`
        *,
        receipts:PaymentReceipt(*)
      `)
      .eq('teamId', teamId)
      .order('dueDate', { ascending: true })

    if (status) query = query.eq('status', status)

    const { data: payments, error } = await query
    if (error) throw error

    let filtered = payments || []

    // Filtrar receipts por jugador actual
    if (!isAdmin && currentPlayerId) {
      filtered = filtered
        .filter((p: any) => {
          const applies = p.appliesTo
          if (!applies || applies.includes('ALL')) return true
          return applies.includes(currentPlayerId)
        })
        .map((p: any) => ({
          ...p,
          receipts: (p.receipts || []).filter((r: any) => r.playerId === currentPlayerId),
        }))
    } else if (!isAdmin && !currentPlayerId) {
      filtered = []
    }

    return NextResponse.json(filtered)
  } catch (error: any) {
    console.error('[API payments GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin puede crear cobros' }, { status: 403 })
    }

    const teamId = session.user.teamId
    if (!teamId) return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })

    const body = await req.json()
    const parsed = createPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    const { data: payment, error } = await supabase
      .from('Payment')
      .insert({
        teamId,
        title: data.title,
        description: data.description,
        type: data.type,
        amount: data.amount,
        dueDate: new Date(data.dueDate).toISOString(),
        recurrence: data.recurrence,
        appliesTo: data.appliesTo,
        status: 'PENDIENTE',
        createdBy: session.user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Crear notificaciones para los jugadores aplicables
    let players: any[] = []
    if (data.appliesTo.includes('ALL')) {
      const { data: allPlayers } = await supabase
        .from('Player')
        .select('userId, id')
        .eq('teamId', teamId)
        .not('userId', 'is', null)
      players = allPlayers || []
    } else {
      const { data: selectedPlayers } = await supabase
        .from('Player')
        .select('userId, id')
        .in('id', data.appliesTo)
        .eq('teamId', teamId)
        .not('userId', 'is', null)
      players = selectedPlayers || []
    }

    const notifications = players.map((p) => ({
      teamId,
      userId: p.userId,
      type: 'NEW_PAYMENT',
      title: `Nuevo cobro: ${data.title}`,
      body: `Monto: $${data.amount.toLocaleString('es-CO')} - Vence: ${new Date(data.dueDate).toLocaleDateString('es-CO')}`,
      channel: 'IN_APP',
      status: 'ENVIADA',
      sentAt: new Date().toISOString(),
      relatedEntityType: 'PAYMENT',
      relatedEntityId: payment.id,
    }))

    if (notifications.length > 0) {
      await supabase.from('Notification').insert(notifications)
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    console.error('[API payments POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
