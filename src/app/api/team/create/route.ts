import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'

const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
  shortName: z.string().min(2).max(4),
  category: z.string().min(2).max(100),
  coachName: z.string().min(2).max(100),
})

/**
 * POST /api/team/create
 * Crea un nuevo equipo y hace al usuario ADMIN de ese equipo.
 * El usuario debe estar logueado pero sin team membership activo.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario no tenga ya un team activo
    if (session.user.teamId) {
      return NextResponse.json(
        { error: 'Ya perteneces a un equipo. Sal del equipo actual primero.' },
        { status: 400 }
      )
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

    const teamId = randomUUID()
    const membershipId = randomUUID()
    const ts = new Date().toISOString()

    // Crear el Team
    const { data: team, error: teamError } = await supabase
      .from('Team')
      .insert({
        id: teamId,
        name: data.name,
        shortName: data.shortName.toUpperCase(),
        category: data.category,
        coachName: data.coachName,
        foundedYear: new Date().getFullYear(),
        onboardingCompleted: false,
        isActive: true,
        createdAt: ts,
        updatedAt: ts,
      })
      .select()
      .single()

    if (teamError) {
      console.error('[API team/create] Team error:', teamError)
      return NextResponse.json({ error: teamError.message }, { status: 500 })
    }

    // Crear membership ADMIN
    const { error: memError } = await supabase
      .from('TeamMembership')
      .insert({
        id: membershipId,
        userId: session.user.id,
        teamId,
        role: 'ADMIN',
        status: 'ACTIVO',
        joinedAt: ts,
      })

    if (memError) {
      console.error('[API team/create] Membership error:', memError)
      // Rollback: eliminar el team creado
      await supabase.from('Team').delete().eq('id', teamId)
      return NextResponse.json({ error: memError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      teamId,
      team: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
      },
    })
  } catch (error: any) {
    console.error('[API team/create] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
