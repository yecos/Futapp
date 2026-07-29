import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/notifications
 * Lista notificaciones del usuario. Solo las dirigidas a él o a su equipo.
 * Query: ?unread=true para solo no leídas
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, status: 'ACTIVO' },
      orderBy: { joinedAt: 'desc' },
      select: { teamId: true },
    })

    if (!membership?.teamId) {
      return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const onlyUnread = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      userId: session.user.id,
    }
    if (onlyUnread) {
      where.status = { in: ['PENDIENTE', 'ENVIADA'] }
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Conteo de no leídas
    const unreadCount = await db.notification.count({
      where: {
        userId: session.user.id,
        status: { in: ['PENDIENTE', 'ENVIADA'] },
      },
    })

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error: any) {
    console.error('[API notifications GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications?markAllRead=true
 * Marca todas como leídas
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const markAll = searchParams.get('markAllRead') === 'true'

    if (markAll) {
      await db.notification.updateMany({
        where: {
          userId: session.user.id,
          status: { in: ['PENDIENTE', 'ENVIADA'] },
        },
        data: {
          status: 'LEIDA',
          readAt: new Date(),
        },
      })
      return NextResponse.json({ success: true, markedAll: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    console.error('[API notifications PATCH] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
