import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const setAttendanceSchema = z.object({
  playerId: z.string(),
  status: z.enum(['ASISTIRE', 'NO_ASISTIRE', 'TAL_VEZ']).nullable(),
  note: z.string().max(200).optional(),
})

/**
 * POST /api/events/[id]/attendance
 * Permite a un jugador confirmar/no confirmar su asistencia a un evento.
 * Si playerId no se pasa, usa el player vinculado al usuario actual.
 * Si se pasa playerId y el usuario es admin/entrenador, actualiza la asistencia de ese jugador.
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
      select: { teamId: true, status: true, date: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }

    // Verificar membership
    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, teamId: event.teamId, status: 'ACTIVO' },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = setAttendanceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    let { playerId, status, note } = parsed.data

    // Si no se pasa playerId, usar el player del usuario actual
    if (!playerId) {
      const myPlayer = await db.player.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      if (!myPlayer) {
        return NextResponse.json(
          { error: 'No tienes perfil de jugador' },
          { status: 400 }
        )
      }
      playerId = myPlayer.id
    } else {
      // Si se pasa playerId, verificar que es admin/entrenador
      if (!['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(membership.role)) {
        return NextResponse.json(
          { error: 'Sin permisos para cambiar asistencia de otros' },
          { status: 403 }
        )
      }
    }

    // Upsert attendance
    const attendance = await db.attendance.upsert({
      where: {
        eventId_playerId: { eventId, playerId },
      },
      create: {
        eventId,
        playerId,
        status,
        note: note || null,
        updatedBy: session.user.id,
      },
      update: {
        status,
        note: note || null,
        updatedBy: session.user.id,
      },
    })

    return NextResponse.json(attendance)
  } catch (error: any) {
    console.error('[API attendance POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/events/[id]/attendance
 * Lista la asistencia de todos los jugadores para un evento
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
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    const attendance = await db.attendance.findMany({
      where: { eventId },
      include: {
        player: {
          select: {
            id: true, fullName: true, jerseyNumber: true,
            primaryPosition: true, photoUrl: true,
          },
        },
      },
      orderBy: { player: { jerseyNumber: 'asc' } },
    })

    return NextResponse.json(attendance)
  } catch (error: any) {
    console.error('[API attendance GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
