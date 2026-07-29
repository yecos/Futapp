import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const updatePlayerSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  jerseyNumber: z.number().int().min(0).max(99).optional(),
  primaryPosition: z.enum(['PORTERO', 'DEFENSA', 'MEDIOCAMPISTA', 'DELANTERO']).optional(),
  secondaryPosition: z.enum(['PORTERO', 'DEFENSA', 'MEDIOCAMPISTA', 'DELANTERO']).optional(),
  age: z.number().int().min(5).max(80).optional(),
  dominantFoot: z.enum(['DIESTRO', 'ZURDO', 'AMBIDIESTRO']).optional(),
  height: z.number().int().min(100).max(250).optional(),
  weight: z.number().int().min(30).max(200).optional(),
  phone: z.string().max(30).optional(),
  emergencyContact: z.string().max(100).optional(),
  status: z.enum(['DISPONIBLE', 'LESIONADO', 'SUSPENDIDO', 'AUSENTE']).optional(),
})

/**
 * PATCH /api/players/[id]
 * Actualiza un jugador. El propio usuario o ADMIN/ENTRENADOR/CUERPO_TECNICO
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

    const player = await db.player.findUnique({
      where: { id },
      select: { teamId: true, userId: true },
    })

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, teamId: player.teamId, status: 'ACTIVO' },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    // El propio usuario o admin/entrenador/cuerpo técnico
    const canEdit = player.userId === session.user.id ||
      ['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(membership.role)

    if (!canEdit) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = updatePlayerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    // Verificar dorsal si se está cambiando
    if (data.jerseyNumber !== undefined) {
      const dorsalInUse = await db.player.findFirst({
        where: {
          teamId: player.teamId,
          jerseyNumber: data.jerseyNumber,
          NOT: { id: id },
        },
        select: { id: true, fullName: true },
      })

      if (dorsalInUse) {
        return NextResponse.json(
          { error: `El dorsal #${data.jerseyNumber} ya está en uso por ${dorsalInUse.fullName}` },
          { status: 400 }
        )
      }
    }

    // Construir update
    const updateData: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value
      }
    }
    // Recalcular fullName si se cambia firstName o lastName
    if (data.firstName || data.lastName) {
      const current = await db.player.findUnique({
        where: { id },
        select: { firstName: true, lastName: true },
      })
      updateData.fullName = `${data.firstName || current?.firstName || ''} ${data.lastName || current?.lastName || ''}`.trim()
    }

    const updated = await db.player.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[API players PATCH] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/players/[id]
 * Elimina un jugador. Solo ADMIN
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

    const player = await db.player.findUnique({
      where: { id },
      select: { teamId: true },
    })

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, teamId: player.teamId, status: 'ACTIVO' },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    if (membership.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo el admin puede eliminar jugadores' },
        { status: 403 }
      )
    }

    await db.player.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API players DELETE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
