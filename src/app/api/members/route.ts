import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const updateMemberSchema = z.object({
  membershipId: z.string(),
  action: z.enum(['approve', 'reject', 'changeRole', 'block']),
  newRole: z.enum(['ADMIN', 'ENTRENADOR', 'JUGADOR', 'CUERPO_TECNICO', 'ACUDIENTE', 'SEGUIDOR']).optional(),
})

/**
 * PATCH /api/members
 * Actualiza el estado o rol de un miembro. Solo admin.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin' }, { status: 403 })
    }

    const teamId = session.user.teamId!
    const body = await req.json()
    const parsed = updateMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { membershipId, action, newRole } = parsed.data

    // Verificar que el membership pertenece al equipo del admin
    const membership = await db.teamMembership.findFirst({
      where: { id: membershipId, teamId },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Membresía no encontrada' }, { status: 404 })
    }

    let updated
    if (action === 'approve') {
      updated = await db.teamMembership.update({
        where: { id: membershipId },
        data: { status: 'ACTIVO', joinedAt: new Date(), acceptedAt: new Date() },
      })
    } else if (action === 'reject') {
      updated = await db.teamMembership.update({
        where: { id: membershipId },
        data: { status: 'BLOQUEADO' },
      })
    } else if (action === 'changeRole' && newRole) {
      updated = await db.teamMembership.update({
        where: { id: membershipId },
        data: { role: newRole },
      })
    } else if (action === 'block') {
      updated = await db.teamMembership.update({
        where: { id: membershipId },
        data: { status: 'BLOQUEADO', leftAt: new Date() },
      })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[API members PATCH] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
