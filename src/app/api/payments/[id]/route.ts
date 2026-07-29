import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const updatePaymentSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  amount: z.number().positive().max(100000000).optional(),
  dueDate: z.string().optional(),
  status: z.enum(['PENDIENTE', 'PAGADO', 'VERIFICADO', 'RECHAZADO', 'VENCIDO']).optional(),
  appliesTo: z.array(z.string()).optional(),
})

/**
 * PATCH /api/payments/[id]
 * Edita un cobro existente. Solo ADMIN
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

    const membership = await db.teamMembership.findFirst({
      where: { userId: session.user.id, status: 'ACTIVO' },
      orderBy: { joinedAt: 'desc' },
      select: { teamId: true, role: true },
    })

    if (!membership?.teamId) {
      return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })
    }

    if (membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin puede editar cobros' }, { status: 403 })
    }

    const { id } = await params

    const payment = await db.payment.findFirst({
      where: { id, teamId: membership.teamId },
      select: { id: true },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = updatePaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate)
    if (data.status !== undefined) updateData.status = data.status
    if (data.appliesTo !== undefined) updateData.appliesTo = data.appliesTo as any

    const updated = await db.payment.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[API payments PATCH] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/payments/[id]
 * Elimina un cobro. Solo ADMIN
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin puede eliminar cobros' }, { status: 403 })
    }

    const { id } = await params

    const payment = await db.payment.findFirst({
      where: { id, teamId: membership.teamId },
      select: { id: true },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
    }

    // Eliminar receipts asociados primero (cascade)
    await db.paymentReceipt.deleteMany({ where: { paymentId: id } })
    await db.payment.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API payments DELETE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
