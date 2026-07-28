import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'

const joinSchema = z.object({
  token: z.string().min(1),
})

/**
 * POST /api/team/join
 * Une al usuario a un equipo existente usando un código/link de invitación.
 * Acepta tanto el token puro como el URL completo.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar directamente en la DB si ya tiene membership ACTIVO
    // (no confiar en el JWT que puede estar desactualizado)
    const { data: existingActive } = await supabase
      .from('TeamMembership')
      .select('id, teamId')
      .eq('userId', session.user.id)
      .eq('status', 'ACTIVO')
      .limit(1)

    if (existingActive && existingActive.length > 0) {
      return NextResponse.json(
        { error: 'Ya perteneces a un equipo. Sal del equipo actual primero.' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const parsed = joinSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      )
    }

    // Extraer token del URL si viene como link completo
    let token = parsed.data.token.trim()
    const urlMatch = token.match(/\/invite\/([a-f0-9-]+)/)
    if (urlMatch) {
      token = urlMatch[1]
    }

    // Buscar el invite
    const { data: invite, error: inviteError } = await supabase
      .from('InviteToken')
      .select('*')
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Código de invitación inválido' },
        { status: 404 }
      )
    }

    // Verificar que no esté usado
    if (invite.usedBy) {
      return NextResponse.json(
        { error: 'Este código ya fue usado' },
        { status: 400 }
      )
    }

    // Verificar que no esté expirado
    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Este código ha expirado' },
        { status: 400 }
      )
    }

    // Crear o actualizar membership
    const { data: existing } = await supabase
      .from('TeamMembership')
      .select('id')
      .eq('userId', session.user.id)
      .eq('teamId', invite.teamId)
      .single()

    if (existing) {
      await supabase
        .from('TeamMembership')
        .update({
          role: invite.role,
          status: 'ACTIVO',
          joinedAt: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('TeamMembership')
        .insert({
          id: randomUUID(),
          userId: session.user.id,
          teamId: invite.teamId,
          role: invite.role,
          status: 'ACTIVO',
          joinedAt: new Date().toISOString(),
        })
    }

    // Marcar invite como usado
    await supabase
      .from('InviteToken')
      .update({
        usedBy: session.user.id,
        usedAt: new Date().toISOString(),
      })
      .eq('id', invite.id)

    // Obtener info del team para la respuesta
    const { data: team } = await supabase
      .from('Team')
      .select('name, shortName, onboardingCompleted')
      .eq('id', invite.teamId)
      .single()

    return NextResponse.json({
      success: true,
      teamId: invite.teamId,
      role: invite.role,
      team: team ? {
        name: team.name,
        shortName: team.shortName,
        onboardingCompleted: team.onboardingCompleted,
      } : null,
    })
  } catch (error: any) {
    console.error('[API team/join] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
