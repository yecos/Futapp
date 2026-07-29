import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const createEventSchema = z.object({
  type: z.enum(['ENTRENAMIENTO', 'PARTIDO', 'TORNEO', 'REUNION', 'EVENTO']),
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  date: z.string(),
  endDate: z.string().optional(),
  location: z.string().min(2).max(200),
  opponent: z.string().max(100).optional(),
  isHome: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, status: 'ACTIVO' },
      orderBy: { joinedAt: 'desc' },
      select: { teamId: true, role: true },
    })

    if (!membership?.teamId) {
      return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: any = { teamId: membership.teamId }
    if (status) where.status = status
    if (type) where.type = type

    const events = await db.event.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        _count: {
          select: { attendances: true, callups: true, checkIns: true },
        },
      },
    })

    return NextResponse.json(events)
  } catch (error: any) {
    console.error('[API events GET] Error:', error)
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
      where: { userId: session.user.id, status: 'ACTIVO' },
      orderBy: { joinedAt: 'desc' },
      select: { teamId: true, role: true },
    })

    if (!membership?.teamId) {
      return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })
    }

    if (!['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Solo admin, entrenador o cuerpo técnico pueden crear eventos' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = createEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    const event = await db.event.create({
      data: {
        teamId: membership.teamId,
        type: data.type,
        title: data.title,
        description: data.description || null,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location,
        opponent: data.opponent || null,
        isHome: data.isHome ?? null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        status: 'PROGRAMADO',
        createdBy: session.user.id,
      },
    })

    // Crear registros de asistencia vacíos para todos los jugadores
    const players = await db.player.findMany({
      where: { teamId: membership.teamId },
      select: { id: true },
    })

    if (players.length > 0) {
      await db.attendance.createMany({
        data: players.map((p) => ({
          eventId: event.id,
          playerId: p.id,
          updatedBy: session.user.id,
        })),
        skipDuplicates: true,
      })
    }

    // Notificar a todos los miembros
    const members = await db.teamMembership.findMany({
      where: { teamId: membership.teamId, status: 'ACTIVO' },
      select: { userId: true },
    })

    if (members.length > 0) {
      await db.notification.createMany({
        data: members.map((m) => ({
          teamId: membership.teamId,
          userId: m.userId,
          type: 'NEW_EVENT',
          title: `Nuevo evento: ${event.title}`,
          body: `${data.type} · ${new Date(event.date).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${event.location}`,
          channel: 'IN_APP',
          status: 'ENVIADA',
          sentAt: new Date(),
          relatedEntityType: 'EVENT',
          relatedEntityId: event.id,
        })),
      })
    }

    return NextResponse.json(event, { status: 201 })
  } catch (error: any) {
    console.error('[API events POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
