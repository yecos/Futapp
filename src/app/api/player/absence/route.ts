import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const REASONS = ['Lesión', 'Trabajo', 'Familia', 'Estudio', 'Otro']

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { eventId, reason } = body

    if (!eventId || !reason) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    if (!REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Motivo inválido' }, { status: 400 })
    }

    // Buscar player
    const player = await db.player.findUnique({
      where: { userId: session.user.id },
      select: { id: true, streak: true, trainingsTotal: true },
    })

    if (!player) return NextResponse.json({ error: 'No tienes perfil de jugador' }, { status: 400 })

    // Verificar que no haya hecho check-in ya
    const existingCheckin = await db.checkIn.findUnique({
      where: { eventId_playerId: { eventId, playerId: player.id } },
      select: { id: true },
    })

    if (existingCheckin) {
      return NextResponse.json({ error: 'Ya hiciste check-in en este evento' }, { status: 400 })
    }

    // Verificar que no haya justificado ya
    const existingAbsence = await db.absence.findUnique({
      where: { eventId_playerId: { eventId, playerId: player.id } },
      select: { id: true },
    })

    if (existingAbsence) {
      return NextResponse.json({ error: 'Ya justificaste ausencia para este evento' }, { status: 400 })
    }

    // Obtener evento para verificar tipo
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { type: true },
    })

    if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

    // Crear justificación
    await db.absence.create({
      data: {
        eventId,
        playerId: player.id,
        userId: session.user.id,
        reason,
      },
    })

    // Si es entrenamiento, romper racha (sin penalización porque justificó)
    const isTraining = event.type === 'ENTRENAMIENTO'
    if (isTraining && player.streak > 0) {
      await db.player.update({
        where: { id: player.id },
        data: {
          streak: 0,
          trainingsTotal: (player.trainingsTotal || 0) + 1,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Ausencia justificada: ${reason}. No perderás puntos.`,
      streakBroken: isTraining && player.streak > 0,
      previousStreak: player.streak,
    })
  } catch (error: any) {
    console.error('[API absence] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
