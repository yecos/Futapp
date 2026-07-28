import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * POST /api/team/leave
 * Permite al usuario salir de su team membership actual.
 * Útil para usuarios que están PENDIENTE y quieren crear su propio equipo.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Consultar membership directamente desde la DB (no del JWT)
    // Incluir tanto ACTIVO como PENDIENTE
    const membership = await db.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['ACTIVO', 'PENDIENTE'] },
      },
      orderBy: { joinedAt: 'desc' },
      select: { role: true, teamId: true, status: true },
    })

    if (!membership?.teamId) {
      return NextResponse.json({ error: 'No tienes equipo' }, { status: 400 })
    }

    // Si es ADMIN ACTIVO, verificar que no sea el único admin del equipo
    if (membership.role === 'ADMIN' && membership.status === 'ACTIVO') {
      const adminCount = await db.teamMembership.count({
        where: {
          teamId: membership.teamId,
          role: 'ADMIN',
          status: 'ACTIVO',
        },
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Eres el único administrador del equipo. Asigna otro admin antes de salir.' },
          { status: 400 }
        )
      }
    }

    // Marcar el membership como RETIRADO (preserva auditoría)
    await db.teamMembership.updateMany({
      where: {
        userId: session.user.id,
        teamId: membership.teamId,
        status: { in: ['ACTIVO', 'PENDIENTE'] },
      },
      data: {
        status: 'RETIRADO',
        leftAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API team/leave] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
