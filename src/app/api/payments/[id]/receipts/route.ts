import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: paymentId } = await params

    const membership = await db.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVO',
      },
      orderBy: { joinedAt: 'desc' },
      select: { teamId: true, role: true },
    })

    const teamId = membership?.teamId
    if (!teamId) return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })

    const payment = await db.payment.findFirst({
      where: { id: paymentId, teamId },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    const allowedRoles = ['ADMIN', 'ENTRENADOR', 'JUGADOR', 'ACUDIENTE']
    if (!allowedRoles.includes(membership.role || '')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Leer formData aquí para que esté disponible en todos los caminos
    const formData = await req.formData()

    let playerId: string | undefined
    if (membership.role === 'JUGADOR') {
      const player = await db.player.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      playerId = player?.id
    } else if (membership.role === 'ACUDIENTE') {
      const player = await db.player.findFirst({
        where: { guardianId: session.user.id },
        select: { id: true },
      })
      playerId = player?.id
    } else if (membership.role === 'ADMIN' || membership.role === 'ENTRENADOR') {
      const explicitPlayerId = formData.get('playerId') as string
      if (explicitPlayerId) {
        const player = await db.player.findFirst({
          where: { id: explicitPlayerId, teamId },
          select: { id: true },
        })
        playerId = player?.id
      }
    }

    if (!playerId) {
      return NextResponse.json({ error: 'No se pudo determinar el jugador' }, { status: 400 })
    }

    const applies = payment.appliesTo as string[]
    if (applies && !applies.includes('ALL') && !applies.includes(playerId)) {
      return NextResponse.json({ error: 'Este cobro no aplica a este jugador' }, { status: 400 })
    }

    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'Archivo no proporcionado' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo JPG, PNG, WebP o PDF.' },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es muy grande. Máximo 5MB.' },
        { status: 400 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayUploads = await db.paymentReceipt.count({
      where: {
        uploadedBy: session.user.id,
        uploadedAt: { gte: today },
      },
    })

    if (todayUploads >= 3) {
      return NextResponse.json(
        { error: 'Has subido muchos comprobantes hoy. Intenta mañana.' },
        { status: 429 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    const amountStr = formData.get('amount') as string
    const reference = formData.get('reference') as string
    const notes = formData.get('notes') as string

    const receipt = await db.paymentReceipt.create({
      data: {
        paymentId,
        teamId,
        playerId,
        uploadedBy: session.user.id,
        receiptUrl: dataUrl,
        amount: amountStr ? parseFloat(amountStr) : null,
        reference: reference || null,
        notes: notes || null,
        status: 'PAGADO',
      },
    })

    // Notificar al admin
    const admins = await db.teamMembership.findMany({
      where: {
        teamId,
        role: 'ADMIN',
        status: 'ACTIVO',
      },
      select: { userId: true },
    })

    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((a) => ({
          teamId,
          userId: a.userId,
          type: 'RECEIPT_UPLOADED',
          title: 'Nuevo comprobante para revisar',
          body: `Comprobante subido para "${payment.title}". Revisa y verifica.`,
          channel: 'IN_APP',
          status: 'ENVIADA',
          sentAt: new Date(),
          relatedEntityType: 'PAYMENT_RECEIPT',
          relatedEntityId: receipt.id,
        })),
      })
    }

    return NextResponse.json(receipt, { status: 201 })
  } catch (error: any) {
    console.error('[API receipts POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: paymentId } = await params

    const membership = await db.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVO',
      },
      orderBy: { joinedAt: 'desc' },
      select: { teamId: true, role: true },
    })

    const teamId = membership?.teamId
    if (!teamId) return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })

    const isAdmin = membership.role === 'ADMIN'

    const where: any = { paymentId, teamId }

    if (!isAdmin) {
      const player = await db.player.findFirst({
        where: {
          OR: [
            { userId: session.user.id },
            { guardianId: session.user.id },
          ],
        },
        select: { id: true },
      })

      if (!player) return NextResponse.json([])
      where.playerId = player.id
    }

    const receipts = await db.paymentReceipt.findMany({
      where,
      include: {
        player: { select: { id: true, fullName: true, jerseyNumber: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    })

    return NextResponse.json(receipts)
  } catch (error: any) {
    console.error('[API receipts GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
