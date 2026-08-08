import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const createOpeningSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  position: z.enum(['PORTERO', 'DEFENSA', 'MEDIOCAMPISTA', 'DELANTERO']),
  city: z.string().max(100).optional(),
  zone: z.string().max(100).optional(),
  compensation: z.string().max(200).optional(),
  expiresInDays: z.number().int().min(1).max(90).default(30),
})

/**
 * GET /api/openings
 * Lista cupos abiertos del marketplace
 * - Si es admin de un equipo: lista los de su equipo
 * - Si es jugador libre: lista todos los disponibles (no expirados, no propios)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') // 'mine' | 'available'
    const position = searchParams.get('position')

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, status: 'ACTIVO' },
      orderBy: { joinedAt: 'desc' },
      select: { teamId: true, role: true },
    })

    const freePlayer = await db.freePlayer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    const where: any = {
      status: 'ABIERTA',
      expiresAt: { gt: new Date() },
    }

    if (filter === 'mine' && membership?.teamId) {
      where.teamId = membership.teamId
      delete where.status
      delete where.expiresAt
    } else if (filter === 'available' && freePlayer) {
      // Excluir cupos del propio equipo (si pertenece a uno)
      if (membership?.teamId) {
        where.NOT = { teamId: membership.teamId }
      }
    }

    if (position) {
      where.position = position
    }

    const openings = await db.opening.findMany({
      where,
      include: {
        team: {
          select: { id: true, name: true, shortName: true, primaryColor: true, category: true },
        },
        _count: { select: { applications: true } },
        applications: freePlayer ? {
          where: { freePlayerId: freePlayer.id },
          select: { id: true, status: true },
        } : false,
      },
      orderBy: [
        { isHighlighted: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 50,
    })

    return NextResponse.json(openings)
  } catch (error: any) {
    console.error('[API openings GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/openings
 * Crea un cupo (solo admin de equipo)
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

    if (membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin puede crear cupos' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createOpeningSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    // Límite: equipos free pueden tener máximo 3 cupos abiertos
    const team = await db.team.findUnique({
      where: { id: membership.teamId },
      select: { isPremium: true, name: true },
    })

    const openCount = await db.opening.count({
      where: { teamId: membership.teamId, status: 'ABIERTA' },
    })

    const limit = team?.isPremium ? 20 : 3
    if (openCount >= limit) {
      return NextResponse.json(
        { error: `Límite de cupos alcanzado (${limit}). ${team?.isPremium ? '' : 'Hazte premium para publicar más.'}` },
        { status: 403 }
      )
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays)

    const opening = await db.opening.create({
      data: {
        teamId: membership.teamId,
        createdBy: session.user.id,
        title: data.title,
        description: data.description || null,
        position: data.position,
        city: data.city || null,
        zone: data.zone || null,
        compensation: data.compensation || null,
        expiresAt,
      },
      include: {
        team: { select: { name: true, shortName: true } },
      },
    })

    return NextResponse.json(opening, { status: 201 })
  } catch (error: any) {
    console.error('[API openings POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
