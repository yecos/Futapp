import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const createApplicationSchema = z.object({
  message: z.string().max(1000).optional(),
})

/**
 * POST /api/openings/[id]/applications
 * Un jugador libre postula a un cupo
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: openingId } = await params

    // Verificar que es jugador libre
    const freePlayer = await db.freePlayer.findUnique({
      where: { userId: session.user.id },
      select: { id: true, fullName: true, isPublic: true },
    })

    if (!freePlayer) {
      return NextResponse.json(
        { error: 'Necesitas un perfil de jugador libre para postular' },
        { status: 403 }
      )
    }

    const opening = await db.opening.findUnique({
      where: { id: openingId },
      select: { id: true, teamId: true, status: true, expiresAt: true },
    })

    if (!opening) {
      return NextResponse.json({ error: 'Cupo no encontrado' }, { status: 404 })
    }

    if (opening.status !== 'ABIERTA') {
      return NextResponse.json({ error: 'Este cupo ya no está abierto' }, { status: 400 })
    }

    if (opening.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Este cupo ya expiró' }, { status: 400 })
    }

    // Verificar que no haya postulado ya
    const existing = await db.application.findUnique({
      where: {
        openingId_freePlayerId: {
          openingId,
          freePlayerId: freePlayer.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya postulaste a este cupo' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const parsed = createApplicationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const application = await db.application.create({
      data: {
        openingId,
        freePlayerId: freePlayer.id,
        message: parsed.data.message || null,
      },
    })

    // Notificar al admin del equipo
    const admins = await db.teamMembership.findMany({
      where: { teamId: opening.teamId, role: 'ADMIN', status: 'ACTIVO' },
      select: { userId: true },
    })

    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((a) => ({
          teamId: opening.teamId,
          userId: a.userId,
          type: 'NEW_APPLICATION',
          title: 'Nueva postulación recibida',
          body: `${freePlayer.fullName} postuló a tu cupo`,
          channel: 'IN_APP',
          status: 'ENVIADA',
          sentAt: new Date(),
          relatedEntityType: 'OPENING',
          relatedEntityId: openingId,
        })),
      })
    }

    return NextResponse.json(application, { status: 201 })
  } catch (error: any) {
    console.error('[API applications POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
