import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const verifySchema = z.object({
  status: z.enum(['VERIFICADO', 'RECHAZADO']),
  rejectionReason: z.string().max(500).optional(),
})

/**
 * POST /api/payments/[id]/verify
 * Verifica o rechaza un comprobante. Solo admin.
 * Body: { status: 'VERIFICADO' | 'RECHAZADO', rejectionReason?: string }
 *
 * Nota: el [id] en la URL es el receiptId, no el paymentId.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin puede verificar' }, { status: 403 })
    }

    const receiptId = params.id
    const teamId = session.user.teamId
    if (!teamId) return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })

    const body = await req.json()
    const parsed = verifySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { status, rejectionReason } = parsed.data

    // Buscar el receipt
    const receipt = await db.paymentReceipt.findFirst({
      where: { id: receiptId, teamId },
      include: { payment: true },
    })
    if (!receipt) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 })
    }

    // Actualizar el receipt
    const updated = await db.paymentReceipt.update({
      where: { id: receiptId },
      data: {
        status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: status === 'RECHAZADO' ? rejectionReason : null,
      },
    })

    // Si fue verificado, verificar si el Payment completo puede pasar a VERIFICADO
    if (status === 'VERIFICADO') {
      const allReceipts = await db.paymentReceipt.findMany({
        where: { paymentId: receipt.paymentId },
      })
      const applies = receipt.payment.appliesTo as string[]

      // Obtener jugadores aplicables
      const players = applies && !applies.includes('ALL')
        ? await db.player.findMany({ where: { id: { in: applies } }, select: { id: true } })
        : await db.player.findMany({ where: { teamId }, select: { id: true } })

      const allVerified = players.every(
        (p) => allReceipts.some((r) => r.playerId === p.id && r.status === 'VERIFICADO')
      )

      if (allVerified) {
        await db.payment.update({
          where: { id: receipt.paymentId },
          data: {
            status: 'VERIFICADO',
            verifiedBy: session.user.id,
            verifiedAt: new Date(),
          },
        })
      }
    }

    // Notificar al jugador
    if (receipt.player.userId) {
      await db.notification.create({
        data: {
          teamId,
          userId: receipt.player.userId,
          type: status === 'VERIFICADO' ? 'PAYMENT_VERIFIED' : 'PAYMENT_REJECTED',
          title: status === 'VERIFICADO'
            ? 'Pago verificado ✅'
            : 'Comprobante rechazado ❌',
          body: status === 'VERIFICADO'
            ? `Tu pago para "${receipt.payment.title}" fue verificado.`
            : `Tu comprobante para "${receipt.payment.title}" fue rechazado. ${rejectionReason || ''}`.trim(),
          channel: 'IN_APP',
          status: 'ENVIADA',
          sentAt: new Date(),
          relatedEntityType: 'PAYMENT_RECEIPT',
          relatedEntityId: receipt.id,
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[API verify POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
