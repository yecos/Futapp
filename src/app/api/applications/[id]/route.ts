import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * PATCH /api/applications/[id]
 * Responder a una postulación (aceptar/rechazar) o retirar
 * Body: { action: 'accept' | 'reject' | 'withdraw', teamResponse?: string }
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

    const application = await db.application.findUnique({
      where: { id },
      include: {
        opening: { select: { teamId: true, title: true } },
        freePlayer: { select: { userId: true, fullName: true } },
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Postulación no encontrada' }, { status: 404 })
    }

    const body = await req.json()
    const { action, teamResponse } = body

    if (!['accept', 'reject', 'withdraw'].includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    // Determinar quién está actuando
    if (action === 'withdraw') {
      // Solo el propio jugador puede retirar
      if (application.freePlayer.userId !== session.user.id) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
      }

      const updated = await db.application.update({
        where: { id },
        data: {
          status: 'RETIRADA',
          updatedAt: new Date(),
        },
      })

      return NextResponse.json(updated)
    }

    // accept o reject: solo admin del equipo
    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, teamId: application.opening.teamId, status: 'ACTIVO' },
      select: { role: true },
    })

    if (membership?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin puede responder' }, { status: 403 })
    }

    const newStatus = action === 'accept' ? 'ACEPTADA' : 'RECHAZADA'

    const updated = await db.application.update({
      where: { id },
      data: {
        status: newStatus,
        teamResponse: teamResponse || null,
        respondedAt: new Date(),
        respondedBy: session.user.id,
        // Si es aceptada, compartir contacto
        contactShared: action === 'accept',
      },
    })

    // Si fue aceptada, marcar el cupo como CUBIERTA
    if (action === 'accept') {
      await db.opening.update({
        where: { id: application.openingId },
        data: { status: 'CUBIERTA' },
      })
    }

    // Notificar al jugador libre
    const notifType = action === 'accept' ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED'
    const notifTitle = action === 'accept' ? '¡Postulación aceptada!' : 'Postulación rechazada'
    const notifBody = action === 'accept'
      ? `${application.opening.title} aceptó tu postulación. Ya puedes contactar al equipo.`
      : `${application.opening.title} rechazó tu postulación.${teamResponse ? ' Motivo: ' + teamResponse : ''}`

    await db.notification.create({
      data: {
        teamId: application.opening.teamId,
        userId: application.freePlayer.userId,
        type: notifType,
        title: notifTitle,
        body: notifBody,
        channel: 'IN_APP',
        status: 'ENVIADA',
        sentAt: new Date(),
        relatedEntityType: 'APPLICATION',
        relatedEntityId: id,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[API applications PATCH] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
