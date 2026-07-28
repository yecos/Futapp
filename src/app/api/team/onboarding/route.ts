import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const onboardingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).default('#16a34a'),
  foundedYear: z.number().int().min(1900).max(new Date().getFullYear() + 1).default(new Date().getFullYear()),
  bankName: z.string().min(2).max(100).default('Bancolombia'),
  accountType: z.enum(['Ahorros', 'Corriente']).default('Ahorros'),
  accountNumber: z.string().min(5).max(30),
  accountHolder: z.string().min(2).max(100),
  paymentInstructions: z.string().max(500).optional().default(''),
})

/**
 * POST /api/team/onboarding
 * Completa el onboarding del equipo (colores + datos bancarios).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const membership = await db.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVO',
      },
      orderBy: { joinedAt: 'desc' },
      select: { role: true, teamId: true },
    })

    if (!membership || !membership.teamId) {
      return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })
    }

    if (membership.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo el admin puede configurar el equipo' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = onboardingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    await db.team.update({
      where: { id: membership.teamId },
      data: {
        primaryColor: data.primaryColor,
        foundedYear: data.foundedYear,
        bankName: data.bankName,
        accountType: data.accountType,
        accountNumber: data.accountNumber,
        accountHolder: data.accountHolder,
        paymentInstructions: data.paymentInstructions,
        onboardingCompleted: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API team/onboarding] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
