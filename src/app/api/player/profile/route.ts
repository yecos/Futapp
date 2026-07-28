import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * POST /api/player/profile
 * Crea el perfil de jugador vinculado al usuario logueado.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { firstName, lastName, fullName, jerseyNumber, primaryPosition,
      secondaryPosition, age, dominantFoot, height, weight, phone,
      emergencyContact, teamId, userId } = body

    if (!firstName || !lastName || !teamId || !userId) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    }

    // Verificar que no tenga ya un player
    const existing = await db.player.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json({ error: 'Ya tienes un perfil de jugador' }, { status: 400 })
    }

    // Si jerseyNumber es 0 o no se especifica, buscar el siguiente disponible
    let finalJerseyNumber = jerseyNumber
    if (!jerseyNumber || jerseyNumber === 0) {
      const usedNumbers = await db.player.findMany({
        where: { teamId },
        select: { jerseyNumber: true },
      })
      const usedSet = new Set(usedNumbers.map((p) => p.jerseyNumber))
      let nextNumber = 1
      while (usedSet.has(nextNumber)) nextNumber++
      finalJerseyNumber = nextNumber
    } else {
      // Verificar que el dorsal no esté en uso
      const dorsalInUse = await db.player.findFirst({
        where: { teamId, jerseyNumber },
        select: { id: true, fullName: true },
      })

      if (dorsalInUse) {
        return NextResponse.json(
          { error: `El dorsal #${jerseyNumber} ya está en uso por ${dorsalInUse.fullName}` },
          { status: 400 }
        )
      }
    }

    // Copiar la foto del User si existe
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { image: true },
    })

    const player = await db.player.create({
      data: {
        teamId,
        userId,
        firstName,
        lastName,
        fullName: fullName || `${firstName} ${lastName}`,
        jerseyNumber: finalJerseyNumber || 0,
        primaryPosition: primaryPosition || 'MEDIOCAMPISTA',
        secondaryPosition: secondaryPosition || null,
        age: age || 25,
        dominantFoot: dominantFoot || 'DIESTRO',
        height: height || null,
        weight: weight || null,
        phone: phone || null,
        emergencyContact: emergencyContact || null,
        status: 'DISPONIBLE',
        photoUrl: user?.image || null,
        matchesPlayed: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        trainingsAttended: 0,
        trainingsTotal: 0,
        statPoints: 0,
        totalPointsEarned: 0,
        streak: 0,
        maxStreak: 0,
        basePAC: 0,
        baseSHO: 0,
        basePAS: 0,
        baseDRI: 0,
        baseDEF: 0,
        basePHY: 0,
      },
    })

    return NextResponse.json(player, { status: 201 })
  } catch (error: any) {
    console.error('[API player/profile POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/player/profile?playerId=xxx
 * Actualiza el perfil de jugador del usuario logueado.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const playerId = searchParams.get('playerId')

    if (!playerId) {
      return NextResponse.json({ error: 'playerId requerido' }, { status: 400 })
    }

    // Verificar que el player existe
    const player = await db.player.findUnique({
      where: { id: playerId },
      select: { id: true, userId: true },
    })

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    // Verificar permisos: el propio usuario o admin
    const membership = await db.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVO',
      },
      orderBy: { joinedAt: 'desc' },
      select: { role: true },
    })

    if (player.userId !== session.user.id && membership?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await req.json()

    const updateData: any = {}
    const allowedFields = [
      'firstName', 'lastName', 'fullName', 'jerseyNumber', 'primaryPosition',
      'secondaryPosition', 'age', 'dominantFoot', 'height', 'weight',
      'phone', 'emergencyContact',
    ]

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field] || null
      }
    }

    // Asegurar que fullName esté actualizado
    if (body.firstName || body.lastName) {
      const current = await db.player.findUnique({
        where: { id: playerId },
        select: { firstName: true, lastName: true },
      })
      updateData.fullName = `${body.firstName || current?.firstName || ''} ${body.lastName || current?.lastName || ''}`.trim()
    }

    const updated = await db.player.update({
      where: { id: playerId },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[API player/profile PATCH] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
