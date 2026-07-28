import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const recentEvents = await db.event.findMany({
      where: {
        status: 'PROGRAMADO',
        date: { lt: oneHourAgo, gt: twoHoursAgo },
      },
      select: { id: true, teamId: true, type: true, date: true, title: true },
    })

    if (recentEvents.length === 0) {
      return NextResponse.json({ success: true, message: 'No events to process', stats: { eventsChecked: 0, playersPenalized: 0 } })
    }

    let playersPenalized = 0

    for (const event of recentEvents) {
      // Obtener todos los jugadores del equipo
      const players = await db.player.findMany({
        where: { teamId: event.teamId },
        select: {
          id: true, statPoints: true, totalPointsEarned: true,
          streak: true, maxStreak: true, fullName: true,
          trainingsTotal: true, userId: true,
        },
      })

      if (players.length === 0) continue

      // Obtener check-ins de este evento
      const checkins = await db.checkIn.findMany({
        where: { eventId: event.id },
        select: { playerId: true },
      })
      const checkedInIds = new Set(checkins.map((c) => c.playerId))

      // Obtener ausencias justificadas
      const absences = await db.absence.findMany({
        where: { eventId: event.id },
        select: { playerId: true },
      })
      const justifiedIds = new Set(absences.map((a) => a.playerId))

      const isTraining = event.type === 'ENTRENAMIENTO'
      const penalty = isTraining ? 2 : 5

      for (const player of players) {
        // Saltar si hizo check-in o justificó
        if (checkedInIds.has(player.id) || justifiedIds.has(player.id)) continue

        // Penalizar
        const newStatPoints = Math.max(0, (player.statPoints || 0) - penalty)
        const newStreak = isTraining ? 0 : (player.streak || 0)

        await db.player.update({
          where: { id: player.id },
          data: {
            statPoints: newStatPoints,
            streak: newStreak,
            trainingsTotal: isTraining ? (player.trainingsTotal || 0) + 1 : player.trainingsTotal,
          },
        })

        // Crear notificación (solo si tiene userId)
        if (player.userId) {
          await db.notification.create({
            data: {
              teamId: event.teamId,
              userId: player.userId,
              type: 'PENALTY',
              title: `Penalización: -${penalty} pts`,
              body: `No asististe a "${event.title}" y no justificaste. -${penalty} puntos.`,
              channel: 'IN_APP',
              status: 'ENVIADA',
              sentAt: now,
            },
          })
        }

        playersPenalized++
      }

      // Marcar evento como COMPLETADO
      await db.event.update({
        where: { id: event.id },
        data: { status: 'COMPLETADO' },
      })
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
