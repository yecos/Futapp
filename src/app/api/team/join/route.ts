import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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
    const existingActive = await db.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVO',
      },
      select: { id: true, teamId: true },
    })

    if (existingActive) {
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
    const invite = await db.inviteToken.findUnique({
      where: { token },
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Código de invitación inválido' },
        { status: 404 }
      )
    }

    if (invite.usedBy) {
      return NextResponse.json(
        { error: 'Este código ya fue usado' },
        { status: 400 }
      )
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Este código ha expirado' },
        { status: 400 }
      )
    }

    // Crear o actualizar membership (transacción)
    await db.$transaction(async (tx) => {
      const existing = await tx.teamMembership.findUnique({
        where: {
          userId_teamId: {
            userId: session.user.id,
            teamId: invite.teamId,
          },
        },
      })

      if (existing) {
        await tx.teamMembership.update({
          where: { id: existing.id },
          data: {
            role: invite.role,
            status: 'ACTIVO',
            joinedAt: new Date(),
          },
        })
      } else {
        await tx.teamMembership.create({
          data: {
            userId: session.user.id,
            teamId: invite.teamId,
            role: invite.role,
            status: 'ACTIVO',
            joinedAt: new Date(),
          },
        })
      }

      // Marcar invite como usado
      await tx.inviteToken.update({
        where: { id: invite.id },
        data: {
          usedBy: session.user.id,
          usedAt: new Date(),
        },
      })
    })

    // Obtener info del team para la respuesta
    const team = await db.team.findUnique({
      where: { id: invite.teamId },
      select: { name: true, shortName: true, onboardingCompleted: true },
    })

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
