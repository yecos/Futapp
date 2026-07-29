import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const saveCallupSchema = z.object({
  eventId: z.string(),
  callups: z.array(z.object({
    playerId: z.string(),
    status: z.enum(['TITULAR', 'SUPLENTE', 'NO_CONVOCADO']),
    positionLabel: z.string().max(10).optional(),
    fieldPosition: z.string().max(20).optional(),
    isCaptain: z.boolean().default(false),
    order: z.number().int().optional(),
    notes: z.string().max(200).optional(),
  })),
})

/**
 * GET /api/callups?eventId=xxx
 * Lista convocatoria de un evento específico
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ error: 'eventId requerido' }, { status: 400 })
    }

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

    const callups = await db.callup.findMany({
      where: { eventId },
      include: {
        player: {
          select: {
            id: true, fullName: true, jerseyNumber: true,
            primaryPosition: true, photoUrl: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(callups)
  } catch (error: any) {
    console.error('[API callups GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/callups
 * Guarda la convocatoria completa de un evento (sobrescribe)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = saveCallupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { eventId, callups } = parsed.data

    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { teamId: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, teamId: event.teamId, status: 'ACTIVO' },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    if (!['ADMIN', 'ENTRENADOR'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Solo admin o entrenador pueden gestionar convocatorias' },
        { status: 403 }
      )
    }

    // Transacción: eliminar convocatoria anterior + crear nueva
    await db.$transaction(async (tx) => {
      await tx.callup.deleteMany({ where: { eventId } })

      if (callups.length > 0) {
        await tx.callup.createMany({
          data: callups.map((c, idx) => ({
            eventId,
            playerId: c.playerId,
            teamId: event.teamId,
            status: c.status,
            positionLabel: c.positionLabel || null,
            fieldPosition: c.fieldPosition || null,
            isCaptain: c.isCaptain,
            order: c.order ?? idx,
            notes: c.notes || null,
          })),
        })
      }
    })

    // Notificar a los convocados titulares
    const titulares = callups.filter(c => c.status === 'TITULAR')
    if (titulares.length > 0) {
      const playersWithUsers = await db.player.findMany({
        where: { id: { in: titulares.map(t => t.playerId) }, userId: { not: null } },
        select: { id: true, userId: true, fullName: true },
      })

      if (playersWithUsers.length > 0) {
        await db.notification.createMany({
          data: playersWithUsers.map(p => ({
            teamId: event.teamId,
            userId: p.userId!,
            type: 'CALLUP',
            title: '📋 Fuiste convocado',
            body: `Eres titular en el próximo partido. Revisa la convocatoria en la app.`,
            channel: 'IN_APP',
            status: 'ENVIADA',
            sentAt: new Date(),
            relatedEntityType: 'EVENT',
            relatedEntityId: eventId,
          })),
        })
      }
    }

    return NextResponse.json({ success: true, count: callups.length })
  } catch (error: any) {
    console.error('[API callups POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
