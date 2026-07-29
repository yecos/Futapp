import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const createAnnouncementSchema = z.object({
  title: z.string().min(2).max(100),
  content: z.string().min(1).max(2000),
  category: z.enum(['GENERAL', 'CONVOCATORIA', 'EVENTO', 'URGENTE', 'PAGO']).default('GENERAL'),
  pinned: z.boolean().default(false),
})

/**
 * GET /api/announcements
 * Lista avisos del equipo del usuario
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, status: 'ACTIVO' },
      orderBy: { joinedAt: 'desc' },
      select: { teamId: true, role: true },
    })

    if (!membership?.teamId) {
      return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })
    }

    const announcements = await db.announcement.findMany({
      where: { teamId: membership.teamId },
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      include: {
        author: { select: { name: true, image: true } },
        reads: {
          where: { userId: session.user.id },
          select: { id: true },
        },
      },
    })

    return NextResponse.json(announcements)
  } catch (error: any) {
    console.error('[API announcements GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/announcements
 * Crea un aviso. Roles: ADMIN, ENTRENADOR, CUERPO_TECNICO
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, status: 'ACTIVO' },
      orderBy: { joinedAt: 'desc' },
      select: { teamId: true, role: true },
    })

    if (!membership?.teamId) {
      return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })
    }

    if (!['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Solo admin, entrenador o cuerpo técnico pueden crear avisos' },
        { status: 403 }
      )
    }

    // Solo ADMIN y ENTRENADOR pueden fijar (pin)
    const body = await req.json()
    const parsed = createAnnouncementSchema.safeParse({
      ...body,
      pinned: body.pinned && !['ADMIN', 'ENTRENADOR'].includes(membership.role) ? false : body.pinned,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    const announcement = await db.announcement.create({
      data: {
        teamId: membership.teamId,
        title: data.title,
        content: data.content,
        category: data.category,
        authorId: session.user.id,
        authorRole: membership.role as any,
        pinned: data.pinned,
        publishedAt: new Date(),
      },
    })

    // Notificar a todos los miembros
    const members = await db.teamMembership.findMany({
      where: { teamId: membership.teamId, status: 'ACTIVO' },
      select: { userId: true },
    })

    if (members.length > 0) {
      await db.notification.createMany({
        data: members.map((m) => ({
          teamId: membership.teamId,
          userId: m.userId,
          type: 'NEW_ANNOUNCEMENT',
          title: `${data.pinned ? '📌 ' : ''}${data.title}`,
          body: data.content.length > 100 ? data.content.substring(0, 100) + '...' : data.content,
          channel: 'IN_APP',
          status: 'ENVIADA',
          sentAt: new Date(),
          relatedEntityType: 'ANNOUNCEMENT',
          relatedEntityId: announcement.id,
        })),
      })
    }

    return NextResponse.json(announcement, { status: 201 })
  } catch (error: any) {
    console.error('[API announcements POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
