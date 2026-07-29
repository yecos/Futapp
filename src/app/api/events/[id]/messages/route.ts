import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const createMessageSchema = z.object({
  body: z.string().min(1).max(2000),
})

/**
 * GET /api/events/[id]/messages
 * Lista mensajes del chat de un evento
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: eventId } = await params

    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { teamId: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, teamId: event.teamId, status: 'ACTIVO' },
      select: { id: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    const messages = await db.eventMessage.findMany({
      where: { eventId },
      include: {
        user: {
          select: { id: true, name: true, image: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    return NextResponse.json(messages)
  } catch (error: any) {
    console.error('[API messages GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/events/[id]/messages
 * Crea un nuevo mensaje en el chat del evento
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: eventId } = await params

    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { teamId: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, teamId: event.teamId, status: 'ACTIVO' },
      select: { id: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createMessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Mensaje inválido', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const message = await db.eventMessage.create({
      data: {
        eventId,
        userId: session.user.id,
        body: parsed.data.body,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, email: true },
        },
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error: any) {
    console.error('[API messages POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
