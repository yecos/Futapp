import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const CHECKIN_RADIUS_METERS = 300
const CHECKIN_WINDOW_MINUTES = 30

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // metros
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function getLevel(totalPoints: number): { name: string; icon: string; color: string; nextLevel: number } {
  if (totalPoints >= 1000) return { name: 'Leyenda', icon: '👑', color: 'text-amber-400', nextLevel: -1 }
  if (totalPoints >= 501) return { name: 'Estrella', icon: '🌟', color: 'text-purple-400', nextLevel: 1000 }
  if (totalPoints >= 301) return { name: 'Profesional', icon: '⭐', color: 'text-sky-400', nextLevel: 501 }
  if (totalPoints >= 151) return { name: 'Semi-Pro', icon: '🥇', color: 'text-emerald-400', nextLevel: 301 }
  if (totalPoints >= 51) return { name: 'Amateur', icon: '🥈', color: 'text-zinc-300', nextLevel: 151 }
  return { name: 'Novato', icon: '🥉', color: 'text-orange-400', nextLevel: 51 }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { eventId, latitude, longitude } = body

    if (!eventId || !latitude || !longitude) {
      return NextResponse.json({ error: 'Faltan datos (eventId, latitude, longitude)' }, { status: 400 })
    }

    // Obtener el evento
    const event = await db.event.findUnique({ where: { id: eventId } })
    if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

    // Verificar ventana de tiempo
    const now = new Date()
    const eventStart = new Date(event.date)
    const windowStart = new Date(eventStart.getTime() - CHECKIN_WINDOW_MINUTES * 60 * 1000)
    const windowEnd = new Date(eventStart.getTime() + CHECKIN_WINDOW_MINUTES * 60 * 1000)

    if (now < windowStart) {
      return NextResponse.json({
        error: `El check-in abre 30 minutos antes del evento (${eventStart.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })})`,
      }, { status: 400 })
    }

    if (now > windowEnd) {
      return NextResponse.json({
        error: 'La ventana de check-in ya cerró (30 min después del inicio)',
      }, { status: 400 })
    }

    // Verificar distancia si el evento tiene coordenadas
    let distance = 0
    if (event.latitude && event.longitude) {
      distance = haversineDistance(latitude, longitude, event.latitude, event.longitude)
      if (distance > CHECKIN_RADIUS_METERS) {
        return NextResponse.json({
          error: `Estás a ${Math.round(distance)}m del evento. Debes estar a menos de ${CHECKIN_RADIUS_METERS}m.`,
          distance: Math.round(distance),
        }, { status: 400 })
      }
    }

    // Buscar el player del usuario
    const player = await db.player.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true, statPoints: true, totalPointsEarned: true, streak: true, maxStreak: true,
        trainingsAttended: true, trainingsTotal: true, matchesPlayed: true,
      },
    })

    if (!player) return NextResponse.json({ error: 'No tienes perfil de jugador' }, { status: 400 })

    // Verificar si ya hizo check-in
    const existingCheckin = await db.checkIn.findUnique({
      where: { eventId_playerId: { eventId, playerId: player.id } },
      select: { id: true },
    })

    if (existingCheckin) {
      return NextResponse.json({ error: 'Ya hiciste check-in en este evento' }, { status: 400 })
    }

    // Verificar si justificó ausencia
    const existingAbsence = await db.absence.findUnique({
      where: { eventId_playerId: { eventId, playerId: player.id } },
      select: { id: true },
    })

    if (existingAbsence) {
      return NextResponse.json({ error: 'Justificaste ausencia para este evento. No puedes hacer check-in.' }, { status: 400 })
    }

    // Calcular puntos
    const isTraining = event.type === 'ENTRENAMIENTO'
    const basePoints = isTraining ? 1 : 3
    const isLate = now > eventStart
    const latePenalty = isLate ? 1 : 0
    const pointsAwarded = basePoints - latePenalty

    // Calcular bonus de racha
    const newStreak = (player.streak || 0) + 1
    let streakBonus = 0
    if (newStreak === 3) streakBonus = 2
    else if (newStreak === 5) streakBonus = 5
    else if (newStreak === 10) streakBonus = 10

    const totalPoints = pointsAwarded + streakBonus
    const newTotalEarned = (player.totalPointsEarned || 0) + totalPoints
    const newStatPoints = (player.statPoints || 0) + totalPoints
    const newMaxStreak = Math.max(player.maxStreak || 0, newStreak)

    // Crear check-in
    await db.checkIn.create({
      data: {
        eventId,
        playerId: player.id,
        userId: session.user.id,
        latitude,
        longitude,
        distance: Math.round(distance),
        pointsAwarded: totalPoints,
        isLate,
      },
    })

    // Actualizar player
    await db.player.update({
      where: { id: player.id },
      data: {
        statPoints: newStatPoints,
        totalPointsEarned: newTotalEarned,
        streak: newStreak,
        maxStreak: newMaxStreak,
        trainingsAttended: isTraining ? (player.trainingsAttended || 0) + 1 : player.trainingsAttended,
        trainingsTotal: isTraining ? (player.trainingsTotal || 0) + 1 : player.trainingsTotal,
        matchesPlayed: !isTraining ? (player.matchesPlayed || 0) + 1 : player.matchesPlayed,
      },
    })

    const level = getLevel(newTotalEarned)

    return NextResponse.json({
      success: true,
      pointsAwarded: totalPoints,
      basePoints,
      streakBonus,
      isLate,
      newStreak,
      newTotalEarned,
      newStatPoints,
      level,
      message: streakBonus > 0
        ? `¡Check-in exitoso! +${basePoints} pts ${isLate ? '(tarde -1)' : ''} 🔥 Racha de ${newStreak}! +${streakBonus} bonus!`
        : `¡Check-in exitoso! +${basePoints} pts ${isLate ? '(llegaste tarde -1)' : ''} 🔥 Racha: ${newStreak}`,
    })
  } catch (error: any) {
    console.error('[API checkin] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
