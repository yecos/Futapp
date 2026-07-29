import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const updateEventSchema = z.object({
  type: z.enum(['ENTRENAMIENTO', 'PARTIDO', 'TORNEO', 'REUNION', 'EVENTO']).optional(),
  title: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  date: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().min(2).max(200).optional(),
  opponent: z.string().max(100).optional(),
  isHome: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  status: z.enum(['PROGRAMADO', 'COMPLETADO', 'CANCELADO']).optional(),
})

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

    const event = await db.event.findUnique({
      where: { id },
      include: {
        attendances: {
          include: {
            player: {
              select: { id: true, fullName: true, jerseyNumber: true, primaryPosition: true, photoUrl: true },
            },
          },
        },
        callups: {
          include: {
            player: {
              select: { id: true, fullName: true, jerseyNumber: true, primaryPosition: true, photoUrl: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        matchStats: {
          include: {
            player: {
              select: { id: true, fullName: true, jerseyNumber: true },
            },
          },
        },
        checkIns: {
          include: {
            player: { select: { id: true, fullName: true, jerseyNumber: true } },
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }

    // Verificar acceso al equipo
    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, teamId: event.teamId, status: 'ACTIVO' },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    return NextResponse.json({ ...event, myRole: membership.role })
  } catch (error: any) {
    console.error('[API events GET id] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

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

    const event = await db.event.findUnique({
      where: { id },
      select: { teamId: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, teamId: event.teamId, status: 'ACTIVO' },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    if (!['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(membership.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = updateEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: any = {}
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        if (key === 'date' || key === 'endDate') {
          updateData[key] = new Date(value as string)
        } else {
          updateData[key] = value
        }
      }
    }

    const updated = await db.event.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[API events PATCH] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

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

    const event = await db.event.findUnique({
      where: { id },
      select: { teamId: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, teamId: event.teamId, status: 'ACTIVO' },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    if (!['ADMIN', 'ENTRENADOR'].includes(membership.role)) {
      return NextResponse.json({ error: 'Solo admin o entrenador' }, { status: 403 })
    }

    await db.event.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API events DELETE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
