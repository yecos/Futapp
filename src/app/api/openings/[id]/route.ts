import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/openings/[id]
 * Detalle de un cupo con sus postulaciones (si es admin del equipo)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const opening = await db.opening.findUnique({
      where: { id },
      include: {
        team: {
          select: { id: true, name: true, shortName: true, primaryColor: true, category: true, coachName: true },
        },
      },
    })

    if (!opening) {
      return NextResponse.json({ error: 'Cupo no encontrado' }, { status: 404 })
    }

    // Verificar acceso
    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, teamId: opening.teamId, status: 'ACTIVO' },
      select: { role: true },
    })

    const isTeamAdmin = membership?.role === 'ADMIN'

    let applications: any[] = []
    if (isTeamAdmin) {
      // Admin ve todas las postulaciones con datos del jugador
      applications = await db.application.findMany({
        where: { openingId: id },
        include: {
          freePlayer: {
            select: {
              id: true, fullName: true, age: true, photoUrl: true,
              primaryPosition: true, city: true, zone: true,
              bestVerticalJumpCm: true, bestSprint10Sec: true, bestSprint20Sec: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json({
      ...opening,
      applications,
      isTeamAdmin,
    })
  } catch (error: any) {
    console.error('[API openings GET id] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/openings/[id]
 * Actualizar estado del cupo (cerrar, cancelar)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const opening = await db.opening.findUnique({
      where: { id },
      select: { teamId: true },
    })

    if (!opening) {
      return NextResponse.json({ error: 'Cupo no encontrado' }, { status: 404 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, teamId: opening.teamId, status: 'ACTIVO' },
      select: { role: true },
    })

    if (membership?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin puede modificar' }, { status: 403 })
    }

    const body = await req.json()
    const { status } = body

    if (!['ABIERTA', 'CERRADA', 'CUBIERTA', 'CANCELADA'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const updated = await db.opening.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[API openings PATCH] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/openings/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const opening = await db.opening.findUnique({
      where: { id },
      select: { teamId: true },
    })

    if (!opening) {
      return NextResponse.json({ error: 'Cupo no encontrado' }, { status: 404 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, teamId: opening.teamId, status: 'ACTIVO' },
      select: { role: true },
    })

    if (membership?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin' }, { status: 403 })
    }

    await db.opening.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API openings DELETE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
