import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const onboardingSchema = z.object({
  name: z.string().min(2).max(100),
  shortName: z.string().min(2).max(4),
  category: z.string().min(2).max(100),
  coachName: z.string().min(2).max(100),
  foundedYear: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  bankName: z.string().default('Bancolombia'),
  accountType: z.enum(['Ahorros', 'Corriente']).default('Ahorros'),
  accountNumber: z.string().min(5).max(30),
  accountHolder: z.string().min(2).max(100),
  paymentInstructions: z.string().max(500).optional().default(''),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin puede configurar el equipo' }, { status: 403 })
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

    const teamId = session.user.teamId
    if (!teamId) {
      return NextResponse.json({ error: 'Sin equipo asignado' }, { status: 400 })
    }

    // Actualizar el team
    await db.team.update({
      where: { id: teamId },
      data: {
        name: data.name,
        shortName: data.shortName.toUpperCase(),
        category: data.category,
        coachName: data.coachName,
        foundedYear: data.foundedYear,
        primaryColor: data.primaryColor,
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
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const teamId = session.user.teamId
    if (!teamId) {
      return NextResponse.json({ error: 'Sin equipo asignado' }, { status: 400 })
    }

    const team = await db.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        shortName: true,
        category: true,
        coachName: true,
        primaryColor: true,
        secondaryColor: true,
        foundedYear: true,
        logoUrl: true,
        description: true,
        bankName: true,
        accountType: true,
        accountNumber: true,
        accountHolder: true,
        qrImageUrl: true,
        paymentInstructions: true,
        onboardingCompleted: true,
      },
    })

    if (!team) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 })
    }

    return NextResponse.json(team)
  } catch (error: any) {
    console.error('[API team] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo el admin puede editar el equipo' }, { status: 403 })
    }

    const body = await req.json()
    const teamId = session.user.teamId
    if (!teamId) {
      return NextResponse.json({ error: 'Sin equipo asignado' }, { status: 400 })
    }

    // Update parcial
    const allowedFields = [
      'name', 'shortName', 'category', 'coachName', 'primaryColor', 'secondaryColor',
      'foundedYear', 'logoUrl', 'description',
      'bankName', 'accountType', 'accountNumber', 'accountHolder', 'qrImageUrl',
      'paymentInstructions',
    ]
    const updateData: any = {}
    for (const field of allowedFields) {
      if (field in body) updateData[field] = body[field]
    }
    if (updateData.shortName) updateData.shortName = updateData.shortName.toUpperCase()

    const updated = await db.team.update({
      where: { id: teamId },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[API team PATCH] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
