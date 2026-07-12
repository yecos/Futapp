import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Sube un comprobante de pago.
 * Recibe FormData con: file (imagen/pdf), paymentId, amount?, reference?, notes?
 *
 * El archivo se guarda temporalmente como base64 en la DB por simplicidad.
 * Para producción, migrar a Supabase Storage bucket privado.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paymentId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const teamId = session.user.teamId
    if (!teamId) return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })

    // Verificar que el pago existe y pertenece al equipo
    const payment = await db.payment.findFirst({
      where: { id: paymentId, teamId },
    })
    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    // Verificar rol del usuario
    const allowedRoles = ['ADMIN', 'ENTRENADOR', 'JUGADOR', 'ACUDIENTE']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Determinar playerId del comprobante
    let playerId: string | undefined
    if (session.user.role === 'JUGADOR') {
      const player = await db.player.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      playerId = player?.id
    } else if (session.user.role === 'ACUDIENTE') {
      const player = await db.player.findFirst({
        where: { guardianId: session.user.id },
        select: { id: true },
      })
      playerId = player?.id
    } else if (session.user.role === 'ADMIN' || session.user.role === 'ENTRENADOR') {
      // El admin puede subir comprobante por otro jugador
      const formData = await req.formData()
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

    // Verificar que el pago aplica al jugador
    const applies = payment.appliesTo as string[]
    if (applies && !applies.includes('ALL') && !applies.includes(playerId)) {
      return NextResponse.json({ error: 'Este cobro no aplica a este jugador' }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'Archivo no proporcionado' }, { status: 400 })
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo JPG, PNG, WebP o PDF.' },
        { status: 400 }
      )
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es muy grande. Máximo 5MB.' },
        { status: 400 }
      )
    }

    // Rate limit básico: máximo 3 receipts por día por user
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayUploads = await db.paymentReceipt.count({
      where: { uploadedBy: session.user.id, uploadedAt: { gte: today } },
    })
    if (todayUploads >= 3) {
      return NextResponse.json(
        { error: 'Has subido muchos comprobantes hoy. Intenta mañana.' },
        { status: 429 }
      )
    }

    // Convertir a base64 para guardar en DB (mejorable a Storage en futuro)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    const amountStr = formData.get('amount') as string
    const reference = formData.get('reference') as string
    const notes = formData.get('notes') as string

    // Crear receipt
    const receipt = await db.paymentReceipt.create({
      data: {
        paymentId,
        teamId,
        playerId,
        uploadedBy: session.user.id,
        receiptUrl: dataUrl, // TODO: migrar a Supabase Storage
        amount: amountStr ? parseFloat(amountStr) : null,
        reference: reference || null,
        notes: notes || null,
        status: 'PAGADO',
      },
    })

    // Notificar al admin
    const admins = await db.teamMembership.findMany({
      where: { teamId, role: 'ADMIN', status: 'ACTIVO' },
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

/**
 * GET /api/payments/[id]/receipts
 * Lista comprobantes de un pago. Solo admin ve todos; jugadores solo los suyos.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const teamId = session.user.teamId
    if (!teamId) return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })

    const isAdmin = session.user.role === 'ADMIN'

    let where: any = { paymentId, teamId }

    if (!isAdmin) {
      // Jugador/acudiente: solo sus propios receipts
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
        player: {
          select: { id: true, fullName: true, jerseyNumber: true },
        },
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
