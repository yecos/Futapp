import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'

const verifySchema = z.object({
  status: z.enum(['VERIFICADO', 'RECHAZADO']),
  rejectionReason: z.string().max(500).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin puede verificar' }, { status: 403 })
    }

    const { id: receiptId } = await params
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

    const { data: receipt, error: receiptError } = await supabase
      .from('PaymentReceipt')
      .select('*, payment:Payment(*)')
      .eq('id', receiptId)
      .eq('teamId', teamId)
      .single()

    if (receiptError || !receipt) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('PaymentReceipt')
      .update({
        status,
        reviewedBy: session.user.id,
        reviewedAt: new Date().toISOString(),
        rejectionReason: status === 'RECHAZADO' ? rejectionReason : null,
      })
      .eq('id', receiptId)

    if (updateError) throw updateError

    if (status === 'VERIFICADO') {
      const { data: allReceipts } = await supabase
        .from('PaymentReceipt')
        .select('playerId, status')
        .eq('paymentId', receipt.paymentId)

      const applies = receipt.payment.appliesTo as string[]
      let players: any[] = []
      if (applies && !applies.includes('ALL')) {
        const { data: selectedPlayers } = await supabase
          .from('Player')
          .select('id')
          .in('id', applies)
        players = selectedPlayers || []
      } else {
        const { data: allPlayers } = await supabase
          .from('Player')
          .select('id')
          .eq('teamId', teamId)
        players = allPlayers || []
      }

      const allVerified = players.every((p) =>
        (allReceipts || []).some((r: any) => r.playerId === p.id && r.status === 'VERIFICADO')
      )

      if (allVerified) {
        await supabase
          .from('Payment')
          .update({
            status: 'VERIFICADO',
            verifiedBy: session.user.id,
            verifiedAt: new Date().toISOString(),
          })
          .eq('id', receipt.paymentId)
      }
    }

    // Notificar al jugador
    const { data: player } = await supabase
      .from('Player')
      .select('userId')
      .eq('id', receipt.playerId)
      .single()

    if (player?.userId) {
      await supabase.from('Notification').insert({
        teamId,
        userId: player.userId,
        type: status === 'VERIFICADO' ? 'PAYMENT_VERIFIED' : 'PAYMENT_REJECTED',
        title: status === 'VERIFICADO' ? 'Pago verificado ✅' : 'Comprobante rechazado ❌',
        body: status === 'VERIFICADO'
          ? `Tu pago para "${receipt.payment.title}" fue verificado.`
          : `Tu comprobante para "${receipt.payment.title}" fue rechazado. ${rejectionReason || ''}`.trim(),
        channel: 'IN_APP',
        status: 'ENVIADA',
        sentAt: new Date().toISOString(),
        relatedEntityType: 'PAYMENT_RECEIPT',
        relatedEntityId: receipt.id,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API verify POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
