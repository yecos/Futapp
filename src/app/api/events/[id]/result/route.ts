import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const setResultSchema = z.object({
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99),
  stats: z.array(z.object({
    playerId: z.string(),
    goals: z.number().int().min(0).max(20).default(0),
    assists: z.number().int().min(0).max(20).default(0),
    minutesPlayed: z.number().int().min(0).max(300).default(0),
    yellowCards: z.number().int().min(0).max(2).default(0),
    redCards: z.number().int().min(0).max(1).default(0),
    saves: z.number().int().min(0).max(50).default(0),
    shots: z.number().int().min(0).max(50).default(0),
    recoveries: z.number().int().min(0).max(100).default(0),
    isMotm: z.boolean().default(false),
    notes: z.string().max(500).optional(),
  })).default([]),
})

/**
 * POST /api/events/[id]/result
 * Carga el resultado de un partido + stats por jugador
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
      select: { teamId: true, type: true, status: true },
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

    if (!['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Solo admin, entrenador o cuerpo técnico pueden cargar resultados' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = setResultSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { homeScore, awayScore, stats } = parsed.data

    // Transacción: actualizar evento + crear/actualizar matchStats + actualizar stats del player
    await db.$transaction(async (tx) => {
      // 1. Actualizar evento con score y marcar como COMPLETADO
      await tx.event.update({
        where: { id: eventId },
        data: {
          homeScore,
          awayScore,
          status: 'COMPLETADO',
        },
      })

      // 2. Eliminar matchStats previos para este evento (en caso de re-cargar)
      await tx.matchStat.deleteMany({ where: { eventId } })

      // 3. Crear nuevos matchStats
      if (stats.length > 0) {
        await tx.matchStat.createMany({
          data: stats.map((s) => ({
            eventId,
            playerId: s.playerId,
            teamId: event.teamId,
            goals: s.goals,
            assists: s.assists,
            minutesPlayed: s.minutesPlayed,
            yellowCards: s.yellowCards,
            redCards: s.redCards,
            saves: s.saves,
            shots: s.shots,
            recoveries: s.recoveries,
            isMotm: s.isMotm,
            notes: s.notes || null,
          })),
        })
      }

      // 4. Actualizar stats cacheadas del player
      const playerIds = stats.map((s) => s.playerId)

      // Resetear stats de los players afectados (sumar lo del partido)
      for (const stat of stats) {
        const player = await tx.player.findUnique({
          where: { id: stat.playerId },
          select: { matchesPlayed: true, goals: true, assists: true, yellowCards: true, redCards: true },
        })
        if (!player) continue

        await tx.player.update({
          where: { id: stat.playerId },
          data: {
            matchesPlayed: player.matchesPlayed + 1,
            goals: player.goals + stat.goals,
            assists: player.assists + stat.assists,
            yellowCards: player.yellowCards + stat.yellowCards,
            redCards: player.redCards + stat.redCards,
          },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API result POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
