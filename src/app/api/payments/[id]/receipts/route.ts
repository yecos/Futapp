import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'

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
    const teamId = session.user.teamId
    if (!teamId) return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })

    const { data: payment, error: payError } = await supabase
      .from('Payment')
      .select('*')
      .eq('id', paymentId)
      .eq('teamId', teamId)
      .single()

    if (payError || !payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    const allowedRoles = ['ADMIN', 'ENTRENADOR', 'JUGADOR', 'ACUDIENTE']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    let playerId: string | undefined
    if (session.user.role === 'JUGADOR') {
      const { data: player } = await supabase
        .from('Player')
        .select('id')
        .eq('userId', session.user.id)
        .single()
      playerId = player?.id
    } else if (session.user.role === 'ACUDIENTE') {
      const { data: player } = await supabase
        .from('Player')
        .select('id')
        .eq('guardianId', session.user.id)
        .limit(1)
        .single()
      playerId = player?.id
    } else if (session.user.role === 'ADMIN' || session.user.role === 'ENTRENADOR') {
      const formData = await req.formData()
      const explicitPlayerId = formData.get('playerId') as string
      if (explicitPlayerId) {
        const { data: player } = await supabase
          .from('Player')
          .select('id')
          .eq('id', explicitPlayerId)
          .eq('teamId', teamId)
          .single()
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

    // Reutilizar el formData ya leído arriba
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
    const { count: todayUploads } = await supabase
      .from('PaymentReceipt')
      .select('*', { count: 'exact', head: true })
      .eq('uploadedBy', session.user.id)
      .gte('uploadedAt', today.toISOString())

    if (todayUploads && todayUploads >= 3) {
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

    const { data: receipt, error: receiptError } = await supabase
      .from('PaymentReceipt')
      .insert({
        paymentId,
        teamId,
        playerId,
        uploadedBy: session.user.id,
        receiptUrl: dataUrl,
        amount: amountStr ? parseFloat(amountStr) : null,
        reference: reference || null,
        notes: notes || null,
        status: 'PAGADO',
      })
      .select()
      .single()

    if (receiptError) throw receiptError

    // Notificar al admin
    const { data: admins } = await supabase
      .from('TeamMembership')
      .select('userId')
      .eq('teamId', teamId)
      .eq('role', 'ADMIN')
      .eq('status', 'ACTIVO')

    if (admins && admins.length > 0) {
      const notifications = admins.map((a: any) => ({
        teamId,
        userId: a.userId,
        type: 'RECEIPT_UPLOADED',
        title: 'Nuevo comprobante para revisar',
        body: `Comprobante subido para "${payment.title}". Revisa y verifica.`,
        channel: 'IN_APP',
        status: 'ENVIADA',
        sentAt: new Date().toISOString(),
        relatedEntityType: 'PAYMENT_RECEIPT',
        relatedEntityId: receipt.id,
      }))
      await supabase.from('Notification').insert(notifications)
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
    const teamId = session.user.teamId
    if (!teamId) return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })

    const isAdmin = session.user.role === 'ADMIN'

    let query = supabase
      .from('PaymentReceipt')
      .select(`
        *,
        player:Player(id, fullName, jerseyNumber)
      `)
      .eq('paymentId', paymentId)
      .eq('teamId', teamId)
      .order('uploadedAt', { ascending: false })

    if (!isAdmin) {
      const { data: player } = await supabase
        .from('Player')
        .select('id')
        .or(`userId.eq.${session.user.id},guardianId.eq.${session.user.id}`)
        .limit(1)
        .single()

      if (!player) return NextResponse.json([])
      query = query.eq('playerId', player.id)
    }

    const { data: receipts, error } = await query
    if (error) throw error

    return NextResponse.json(receipts || [])
  } catch (error: any) {
    console.error('[API receipts GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
