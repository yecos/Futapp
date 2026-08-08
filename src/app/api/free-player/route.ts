import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const createFreePlayerSchema = z.object({
  fullName: z.string().min(2).max(100),
  age: z.number().int().min(5).max(80),
  city: z.string().max(100).optional(),
  zone: z.string().max(100).optional(),
  primaryPosition: z.enum(['PORTERO', 'DEFENSA', 'MEDIOCAMPISTA', 'DELANTERO']),
  secondaryPosition: z.enum(['PORTERO', 'DEFENSA', 'MEDIOCAMPISTA', 'DELANTERO']).optional(),
  dominantFoot: z.enum(['DIESTRO', 'ZURDO', 'AMBIDIESTRO']).default('DIESTRO'),
  height: z.number().int().min(100).max(250).optional(),
  weight: z.number().int().min(30).max(200).optional(),
  bio: z.string().max(1000).optional(),
})

/**
 * GET /api/free-player
 * Retorna el perfil de jugador libre del usuario actual
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const freePlayer = await db.freePlayer.findUnique({
      where: { userId: session.user.id },
      include: {
        testResults: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!freePlayer) {
      return NextResponse.json({ error: 'No tienes perfil de jugador libre' }, { status: 404 })
    }

    return NextResponse.json(freePlayer)
  } catch (error: any) {
    console.error('[API free-player GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/free-player
 * Crea el perfil de jugador libre para el usuario actual
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que no tenga ya un perfil de jugador libre
    const existing = await db.freePlayer.findUnique({
      where: { userId: session.user.id },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya tienes un perfil de jugador libre', freePlayer: existing },
        { status: 400 }
      )
    }

    const body = await req.json()
    const parsed = createFreePlayerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    // Copiar foto del User si existe
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { image: true, name: true },
    })

    const freePlayer = await db.freePlayer.create({
      data: {
        userId: session.user.id,
        fullName: data.fullName,
        age: data.age,
        city: data.city || null,
        zone: data.zone || null,
        photoUrl: user?.image || null,
        primaryPosition: data.primaryPosition,
        secondaryPosition: data.secondaryPosition || null,
        dominantFoot: data.dominantFoot,
        height: data.height || null,
        weight: data.weight || null,
        bio: data.bio || null,
      },
    })

    return NextResponse.json(freePlayer, { status: 201 })
  } catch (error: any) {
    console.error('[API free-player POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/free-player
 * Actualiza el perfil de jugador libre
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const freePlayer = await db.freePlayer.findUnique({
      where: { userId: session.user.id },
    })

    if (!freePlayer) {
      return NextResponse.json({ error: 'No tienes perfil de jugador libre' }, { status: 404 })
    }

    const body = await req.json()
    const allowedFields = [
      'fullName', 'age', 'city', 'zone', 'photoUrl',
      'primaryPosition', 'secondaryPosition', 'dominantFoot',
      'height', 'weight', 'bio', 'isPublic',
    ]
    const updateData: any = {}
    for (const field of allowedFields) {
      if (field in body) updateData[field] = body[field]
    }

    const updated = await db.freePlayer.update({
      where: { id: freePlayer.id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[API free-player PATCH] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
