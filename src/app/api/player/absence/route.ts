import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'

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
    const { data: player } = await supabase
      .from('Player')
      .select('id, streak, trainingsTotal')
      .eq('userId', session.user.id)
      .single()

    if (!player) return NextResponse.json({ error: 'No tienes perfil de jugador' }, { status: 400 })

    // Verificar que no haya hecho check-in ya
    const { data: existingCheckin } = await supabase
      .from('CheckIn')
      .select('id')
      .eq('eventId', eventId)
      .eq('playerId', player.id)
      .single()

    if (existingCheckin) {
      return NextResponse.json({ error: 'Ya hiciste check-in en este evento' }, { status: 400 })
    }

    // Verificar que no haya justificado ya
    const { data: existingAbsence } = await supabase
      .from('Absence')
      .select('id')
      .eq('eventId', eventId)
      .eq('playerId', player.id)
      .single()

    if (existingAbsence) {
      return NextResponse.json({ error: 'Ya justificaste ausencia para este evento' }, { status: 400 })
    }

    // Obtener evento para verificar tipo
    const { data: event } = await supabase
      .from('Event')
      .select('type')
      .eq('id', eventId)
      .single()

    if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

    // Crear justificación
    await supabase.from('Absence').insert({
      id: randomUUID(),
      eventId,
      playerId: player.id,
      userId: session.user.id,
      reason,
    })

    // Si es entrenamiento, romper racha (sin penalización porque justificó)
    const isTraining = event.type === 'ENTRENAMIENTO'
    if (isTraining && player.streak > 0) {
      await supabase.from('Player').update({
        streak: 0,
        trainingsTotal: (player.trainingsTotal || 0) + 1,
      }).eq('id', player.id)
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
