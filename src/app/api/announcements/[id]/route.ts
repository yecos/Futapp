import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const updateSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  content: z.string().min(1).max(2000).optional(),
  category: z.enum(['GENERAL', 'CONVOCATORIA', 'EVENTO', 'URGENTE', 'PAGO']).optional(),
  pinned: z.boolean().optional(),
})

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

    const announcement = await db.announcement.findUnique({
      where: { id },
      select: { teamId: true, authorId: true },
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Aviso no encontrado' }, { status: 404 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, teamId: announcement.teamId, status: 'ACTIVO' },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    // Solo el autor o admin puede editar
    if (announcement.authorId !== session.user.id && membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await db.announcement.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[API announcements PATCH] Error:', error)
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

    const announcement = await db.announcement.findUnique({
      where: { id },
      select: { teamId: true, authorId: true },
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Aviso no encontrado' }, { status: 404 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, teamId: announcement.teamId, status: 'ACTIVO' },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    }

    if (announcement.authorId !== session.user.id && membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    await db.announcement.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API announcements DELETE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
