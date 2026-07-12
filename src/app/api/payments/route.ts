import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const createPaymentSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  type: z.enum([
    'MENSUALIDAD', 'ARBITRAJE', 'UNIFORME', 'INSCRIPCION',
    'EVENTO', 'MULTA', 'OTRO',
  ]),
  amount: z.number().positive().max(100000000), // max 100 millones COP
  dueDate: z.string().or(z.date()),
  recurrence: z.enum(['UNICO', 'MENSUAL', 'SEMESTRAL', 'ANUAL']).default('UNICO'),
  appliesTo: z.array(z.string()).default(['ALL']), // ['ALL'] o playerIds
})

/**
 * GET /api/payments
 * Lista pagos. Jugadores ven solo los que les aplican; admins ven todos.
 */
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
    const onlyMine = searchParams.get('mine') === 'true'

    // Si es jugador, forzar onlyMine
    const isPlayer = session.user.role === 'JUGADOR' || session.user.role === 'ACUDIENTE'
    const isAdmin = session.user.role === 'ADMIN'

    // Buscar player profile del usuario actual (para filtrar)
    let currentPlayerId: string | undefined
    if (session.user.role === 'JUGADOR') {
      const player = await db.player.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      currentPlayerId = player?.id
    } else if (session.user.role === 'ACUDIENTE') {
      const player = await db.player.findFirst({
        where: { guardianId: session.user.id },
        select: { id: true },
      })
      currentPlayerId = player?.id
    }

    const where: any = { teamId }
    if (status) where.status = status

    let payments = await db.payment.findMany({
      where,
      include: {
        receipts: {
          where: currentPlayerId ? { playerId: currentPlayerId } : undefined,
          select: {
            id: true,
            status: true,
            receiptUrl: true,
            uploadedAt: true,
            reviewedAt: true,
            rejectionReason: true,
            amount: true,
            reference: true,
          },
        },
        _count: {
          select: { receipts: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    // Filtrar por appliesTo si no es admin
    if (!isAdmin && currentPlayerId) {
      payments = payments.filter((p) => {
        const applies = p.appliesTo as string[]
        if (!applies || applies.includes('ALL')) return true
        return applies.includes(currentPlayerId!)
      })
    } else if (!isAdmin && !currentPlayerId) {
      // Jugador sin profile: no debería ver pagos
      payments = []
    }

    // Si onlyMine, solo pendientes/pagados/verificados del usuario
    if (onlyMine || isPlayer) {
      // ya filtrado por receipts arriba, solo ocultar los que ya están VERIFICADO totalmente
    }

    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('[API payments GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payments
 * Crea un cobro. Solo admin.
 */
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

    const payment = await db.payment.create({
      data: {
        teamId,
        title: data.title,
        description: data.description,
        type: data.type,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
        recurrence: data.recurrence,
        appliesTo: data.appliesTo,
        status: 'PENDIENTE',
        createdBy: session.user.id,
      },
    })

    // Crear notificaciones para los jugadores aplicables
    const players = data.appliesTo.includes('ALL')
      ? await db.player.findMany({ where: { teamId }, select: { userId: true, id: true } })
      : await db.player.findMany({
          where: { id: { in: data.appliesTo }, teamId },
          select: { userId: true, id: true },
        })

    const notifications = players
      .filter((p) => p.userId)
      .map((p) => ({
        teamId,
        userId: p.userId!,
        type: 'NEW_PAYMENT',
        title: `Nuevo cobro: ${data.title}`,
        body: `Monto: $${data.amount.toLocaleString('es-CO')} - Vence: ${new Date(data.dueDate).toLocaleDateString('es-CO')}`,
        channel: 'IN_APP' as const,
        status: 'ENVIADA' as const,
        sentAt: new Date(),
        relatedEntityType: 'PAYMENT',
        relatedEntityId: payment.id,
      }))

    if (notifications.length > 0) {
      await db.notification.createMany({ data: notifications })
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
