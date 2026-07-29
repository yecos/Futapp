import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const createPlayerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  jerseyNumber: z.number().int().min(0).max(99),
  primaryPosition: z.enum(['PORTERO', 'DEFENSA', 'MEDIOCAMPISTA', 'DELANTERO']),
  secondaryPosition: z.enum(['PORTERO', 'DEFENSA', 'MEDIOCAMPISTA', 'DELANTERO']).optional(),
  age: z.number().int().min(5).max(80),
  dominantFoot: z.enum(['DIESTRO', 'ZURDO', 'AMBIDIESTRO']).default('DIESTRO'),
  height: z.number().int().min(100).max(250).optional(),
  weight: z.number().int().min(30).max(200).optional(),
  phone: z.string().max(30).optional(),
  emergencyContact: z.string().max(100).optional(),
  status: z.enum(['DISPONIBLE', 'LESIONADO', 'SUSPENDIDO', 'AUSENTE']).default('DISPONIBLE'),
})

/**
 * GET /api/players
 * Lista jugadores del equipo
 */
export async function GET() {
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

    const players = await db.player.findMany({
      where: { teamId: membership.teamId },
      select: {
        id: true,
        fullName: true,
        jerseyNumber: true,
        primaryPosition: true,
        secondaryPosition: true,
        age: true,
        dominantFoot: true,
        height: true,
        weight: true,
        phone: true,
        emergencyContact: true,
        status: true,
        photoUrl: true,
        matchesPlayed: true,
        goals: true,
        assists: true,
        yellowCards: true,
        redCards: true,
        statPoints: true,
        totalPointsEarned: true,
        streak: true,
        maxStreak: true,
      },
      orderBy: { jerseyNumber: 'asc' },
    })

    return NextResponse.json(players)
  } catch (error: any) {
    console.error('[API players GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/players
 * Crea un nuevo jugador en el equipo. Roles: ADMIN, ENTRENADOR, CUERPO_TECNICO
 */
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
        { error: 'Solo admin, entrenador o cuerpo técnico pueden agregar jugadores' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = createPlayerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    // Verificar que el dorsal no esté en uso
    const dorsalInUse = await db.player.findFirst({
      where: { teamId: membership.teamId, jerseyNumber: data.jerseyNumber },
      select: { id: true, fullName: true },
    })

    if (dorsalInUse) {
      return NextResponse.json(
        { error: `El dorsal #${data.jerseyNumber} ya está en uso por ${dorsalInUse.fullName}` },
        { status: 400 }
      )
    }

    const player = await db.player.create({
      data: {
        teamId: membership.teamId,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        jerseyNumber: data.jerseyNumber,
        primaryPosition: data.primaryPosition,
        secondaryPosition: data.secondaryPosition || null,
        age: data.age,
        dominantFoot: data.dominantFoot,
        height: data.height || null,
        weight: data.weight || null,
        phone: data.phone || null,
        emergencyContact: data.emergencyContact || null,
        status: data.status,
      },
    })

    return NextResponse.json(player, { status: 201 })
  } catch (error: any) {
    console.error('[API players POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
