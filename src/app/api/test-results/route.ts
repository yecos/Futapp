import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const createTestResultSchema = z.object({
  type: z.enum(['SALTO_VERTICAL', 'SPRINT_10M', 'SPRINT_20M', 'CAMBIO_DIRECCION', 'TOQUES_BALON', 'ANTROPOMETRIA']),
  value: z.number().positive(),
  unit: z.string().min(1).max(10),
  videoUrl: z.string().optional(),
  deviceInfo: z.string().optional(),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
  recordedAt: z.string(), // ISO timestamp de cuándo se grabó
})

/**
 * GET /api/test-results
 * Lista los resultados de tests del jugador libre actual
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const freePlayer = await db.freePlayer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!freePlayer) {
      return NextResponse.json({ error: 'No tienes perfil de jugador libre' }, { status: 404 })
    }

    const results = await db.testResult.findMany({
      where: { freePlayerId: freePlayer.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('[API test-results GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/test-results
 * Guarda un nuevo resultado de test
 * El video se guarda como base64 en videoUrl (máximo 10MB)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const freePlayer = await db.freePlayer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!freePlayer) {
      return NextResponse.json({ error: 'No tienes perfil de jugador libre' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = createTestResultSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    // Validar que el video no sea demasiado grande (10MB en base64 ≈ 13M chars)
    if (data.videoUrl && data.videoUrl.length > 13_000_000) {
      return NextResponse.json(
        { error: 'El video es demasiado grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    // Validar que recordedAt no sea del futuro ni de hace más de 1 hora
    // (para evitar subir videos pre-grabados)
    const recordedAt = new Date(data.recordedAt)
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    if (recordedAt > now) {
      return NextResponse.json(
        { error: 'La fecha de grabación no puede ser del futuro' },
        { status: 400 }
      )
    }

    if (recordedAt < oneHourAgo) {
      return NextResponse.json(
        { error: 'El video debe ser grabado en la última hora. No se permiten videos pre-grabados.' },
        { status: 400 }
      )
    }

    // Crear el resultado
    const result = await db.testResult.create({
      data: {
        freePlayerId: freePlayer.id,
        type: data.type,
        value: data.value,
        unit: data.unit,
        videoUrl: data.videoUrl || null,
        deviceInfo: data.deviceInfo || null,
        gpsLat: data.gpsLat || null,
        gpsLng: data.gpsLng || null,
        recordedAt,
      },
    })

    // Actualizar stats cacheadas del FreePlayer
    const updateData: any = {}
    if (data.type === 'SALTO_VERTICAL' && data.unit === 'cm') {
      const current = await db.freePlayer.findUnique({
        where: { id: freePlayer.id },
        select: { bestVerticalJumpCm: true },
      })
      if (!current?.bestVerticalJumpCm || data.value > current.bestVerticalJumpCm) {
        updateData.bestVerticalJumpCm = Math.round(data.value)
      }
    } else if (data.type === 'SPRINT_10M' && data.unit === 'seg') {
      const current = await db.freePlayer.findUnique({
        where: { id: freePlayer.id },
        select: { bestSprint10Sec: true },
      })
      if (!current?.bestSprint10Sec || data.value < current.bestSprint10Sec) {
        updateData.bestSprint10Sec = data.value
      }
    } else if (data.type === 'SPRINT_20M' && data.unit === 'seg') {
      const current = await db.freePlayer.findUnique({
        where: { id: freePlayer.id },
        select: { bestSprint20Sec: true },
      })
      if (!current?.bestSprint20Sec || data.value < current.bestSprint20Sec) {
        updateData.bestSprint20Sec = data.value
      }
    }

    if (Object.keys(updateData).length > 0) {
      await db.freePlayer.update({
        where: { id: freePlayer.id },
        data: updateData,
      })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('[API test-results POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
