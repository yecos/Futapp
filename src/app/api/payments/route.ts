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

    const membership = await db.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVO',
      },
      orderBy: { joinedAt: 'desc' },
      select: { teamId: true, role: true },
    })

    const teamId = membership?.teamId
    if (!teamId) return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const isPlayer = membership.role === 'JUGADOR' || membership.role === 'ACUDIENTE'
    const isAdmin = membership.role === 'ADMIN'

    let currentPlayerId: string | undefined
    if (membership.role === 'JUGADOR') {
      const player = await db.player.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      currentPlayerId = player?.id
    } else if (membership.role === 'ACUDIENTE') {
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
      include: { receipts: true },
      orderBy: { dueDate: 'asc' },
    })

    let filtered: any[] = payments

    if (!isAdmin && currentPlayerId) {
      filtered = payments
        .filter((p: any) => {
          const applies = p.appliesTo as string[]
          if (!applies || applies.includes('ALL')) return true
          return applies.includes(currentPlayerId)
        })
        .map((p: any) => ({
          ...p,
          receipts: p.receipts.filter((r: any) => r.playerId === currentPlayerId),
        }))
    } else if (!isAdmin && !currentPlayerId) {
      filtered = []
    }

    const converted = filtered.map((p: any) => ({
      ...p,
      amount: Number(p.amount),
      receipts: (p.receipts || []).map((r: any) => ({
        ...r,
        amount: r.amount ? Number(r.amount) : null,
      })),
    }))

    return NextResponse.json(converted)
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

    const membership = await db.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVO',
      },
      orderBy: { joinedAt: 'desc' },
      select: { teamId: true, role: true },
    })

    const teamId = membership?.teamId
    if (!teamId) return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })

    if (membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin puede crear cobros' }, { status: 403 })
    }

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
        appliesTo: data.appliesTo as any,
        status: 'PENDIENTE',
        createdBy: session.user.id,
      },
    })

    // Crear notificaciones para los jugadores aplicables
    let players: { userId: string | null; id: string }[] = []
    if (data.appliesTo.includes('ALL')) {
      players = await db.player.findMany({
        where: { teamId, userId: { not: null } },
        select: { userId: true, id: true },
      })
    } else {
      players = await db.player.findMany({
        where: {
          id: { in: data.appliesTo },
          teamId,
          userId: { not: null },
        },
        select: { userId: true, id: true },
      })
    }

    const notifications = players
      .filter((p) => p.userId !== null)
      .map((p) => ({
        teamId,
        userId: p.userId!,
        type: 'NEW_PAYMENT',
        title: `Nuevo cobro: ${data.title}`,
        body: `Monto: $${data.amount.toLocaleString('es-CO')} - Vence: ${new Date(data.dueDate).toLocaleDateString('es-CO')}`,
        channel: 'IN_APP',
        status: 'ENVIADA',
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
