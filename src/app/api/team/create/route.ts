import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
  shortName: z.string().min(2).max(4),
  category: z.string().min(2).max(100),
  coachName: z.string().min(2).max(100),
})

/**
 * POST /api/team/create
 * Crea un nuevo equipo y hace al usuario ADMIN.
 * RECHAZA si el usuario ya tiene un membership ACTIVO.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar directamente desde la DB si ya tiene membership ACTIVO
    const existingMembership = await db.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVO',
      },
      select: { id: true, teamId: true, role: true },
    })

    if (existingMembership) {
      return NextResponse.json({
        success: true,
        alreadyHasTeam: true,
        teamId: existingMembership.teamId,
        message: 'Ya tienes un equipo activo',
      })
    }

    const body = await req.json()
    const parsed = createTeamSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    // Crear Team + Membership en transacción
    const team = await db.team.create({
      data: {
        name: data.name,
        shortName: data.shortName.toUpperCase(),
        category: data.category,
        coachName: data.coachName,
        foundedYear: new Date().getFullYear(),
        onboardingCompleted: false,
        isActive: true,
        memberships: {
          create: {
            userId: session.user.id,
            role: 'ADMIN',
            status: 'ACTIVO',
            joinedAt: new Date(),
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      teamId: team.id,
    })
  } catch (error: any) {
    console.error('[API team/create] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
