import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

/**
 * GET /api/cron/penalize
 * Ejecutado cada 30 min por Vercel Cron.
 * Busca eventos que terminaron hace 1h y penaliza a quienes:
 * - No hicieron check-in
 * - No justificaron ausencia
 */
export async function GET(req: NextRequest) {
  const isCron = req.headers.get('x-vercel-cron') === '1'
  if (!isCron && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const now = new Date()
    // Buscar eventos que terminaron hace más de 1h pero menos de 2h
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

    const { data: recentEvents } = await supabase
      .from('Event')
      .select('id, teamId, type, date, title')
      .eq('status', 'PROGRAMADO')
      .lt('date', oneHourAgo.toISOString())
      .gt('date', twoHoursAgo.toISOString())

    if (!recentEvents || recentEvents.length === 0) {
      return NextResponse.json({ success: true, message: 'No events to process', stats: { eventsChecked: 0, playersPenalized: 0 } })
    }

    let playersPenalized = 0

    for (const event of recentEvents) {
      // Obtener todos los jugadores del equipo
      const { data: players } = await supabase
        .from('Player')
        .select('id, statPoints, totalPointsEarned, streak, maxStreak, fullName, trainingsTotal, userId')
        .eq('teamId', event.teamId)

      if (!players) continue

      // Obtener check-ins de este evento
      const { data: checkins } = await supabase
        .from('CheckIn')
        .select('playerId')
        .eq('eventId', event.id)

      const checkedInIds = new Set((checkins || []).map(c => c.playerId))

      // Obtener ausencias justificadas
      const { data: absences } = await supabase
        .from('Absence')
        .select('playerId')
        .eq('eventId', event.id)

      const justifiedIds = new Set((absences || []).map(a => a.playerId))

      const isTraining = event.type === 'ENTRENAMIENTO'
      const penalty = isTraining ? 2 : 5

      for (const player of players) {
        // Saltar si hizo check-in o justificó
        if (checkedInIds.has(player.id) || justifiedIds.has(player.id)) continue

        // Penalizar
        const newStatPoints = Math.max(0, (player.statPoints || 0) - penalty)
        const newStreak = isTraining ? 0 : (player.streak || 0) // Solo rompe racha si es entrenamiento

        await supabase.from('Player').update({
          statPoints: newStatPoints,
          streak: newStreak,
          trainingsTotal: isTraining ? (player.trainingsTotal || 0) + 1 : player.trainingsTotal,
          updatedAt: now.toISOString(),
        }).eq('id', player.id)

        // Crear notificación
        await supabase.from('Notification').insert({
          id: crypto.randomUUID(),
          teamId: event.teamId,
          userId: player.userId || player.id,
          type: 'PENALTY',
          title: `Penalización: -${penalty} pts`,
          body: `No asististe a "${event.title}" y no justificaste. -${penalty} puntos.`,
          channel: 'IN_APP',
          status: 'ENVIADA',
          sentAt: now.toISOString(),
        })

        playersPenalized++
      }

      // Marcar evento como COMPLETADO
      await supabase.from('Event').update({
        status: 'COMPLETADO',
        updatedAt: now.toISOString(),
      }).eq('id', event.id)
    }

    return NextResponse.json({
      success: true,
      executedAt: now.toISOString(),
      stats: {
        eventsChecked: recentEvents.length,
        playersPenalized,
      },
    })
  } catch (error: any) {
    console.error('[Cron penalize] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
