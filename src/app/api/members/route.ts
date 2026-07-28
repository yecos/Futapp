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

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const membership = await db.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVO',
      },
      orderBy: { joinedAt: 'desc' },
      select: { role: true, teamId: true },
    })

    if (!membership?.teamId) {
      return NextResponse.json({ error: 'Sin equipo asignado' }, { status: 400 })
    }

    if (membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin' }, { status: 403 })
    }

    const teamId = membership.teamId
    const body = await req.json()
    const parsed = updateMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { membershipId, action, newRole } = parsed.data

    // Verificar que el membership existe y pertenece al equipo
    const targetMembership = await db.teamMembership.findFirst({
      where: { id: membershipId, teamId },
    })

    if (!targetMembership) {
      return NextResponse.json({ error: 'Membresía no encontrada' }, { status: 404 })
    }

    const now = new Date()
    let update: any = {}

    if (action === 'approve') {
      update = { status: 'ACTIVO', joinedAt: now, acceptedAt: now }
    } else if (action === 'reject') {
      update = { status: 'BLOQUEADO' }
    } else if (action === 'changeRole' && newRole) {
      update = { role: newRole }
    } else if (action === 'block') {
      update = { status: 'BLOQUEADO', leftAt: now }
    }

    const updated = await db.teamMembership.update({
      where: { id: membershipId },
      data: update,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[API members PATCH] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
