import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

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
    const { data: existing } = await supabase
      .from('Player')
      .select('id')
      .eq('userId', userId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Ya tienes un perfil de jugador' }, { status: 400 })
    }

    const ts = new Date().toISOString()
    const playerData: any = {
      id: randomUUID(),
      teamId,
      userId,
      firstName,
      lastName,
      fullName: fullName || `${firstName} ${lastName}`,
      jerseyNumber: jerseyNumber || 0,
      primaryPosition: primaryPosition || 'MEDIOCAMPISTA',
      secondaryPosition: secondaryPosition || null,
      age: age || 25,
      dominantFoot: dominantFoot || 'DIESTRO',
      height: height || null,
      weight: weight || null,
      phone: phone || null,
      emergencyContact: emergencyContact || null,
      status: 'DISPONIBLE',
      matchesPlayed: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      trainingsAttended: 0,
      trainingsTotal: 0,
      createdAt: ts,
      updatedAt: ts,
    }

    // Copiar la foto del User si existe
    const { data: user } = await supabase
      .from('User')
      .select('image')
      .eq('id', userId)
      .single()

    if (user?.image) {
      playerData.photoUrl = user.image
    }

    const { data, error } = await supabase
      .from('Player')
      .insert(playerData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
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

    // Verificar que el player pertenece al usuario
    const { data: player } = await supabase
      .from('Player')
      .select('id, userId')
      .eq('id', playerId)
      .single()

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    // Verificar permisos: el propio usuario o admin
    const { data: membership } = await supabase
      .from('TeamMembership')
      .select('role')
      .eq('userId', session.user.id)
      .eq('status', 'ACTIVO')
      .single()

    if (player.userId !== session.user.id && membership?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await req.json()

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

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
      const { data: current } = await supabase
        .from('Player')
        .select('firstName, lastName')
        .eq('id', playerId)
        .single()

      updateData.fullName = `${body.firstName || current?.firstName || ''} ${body.lastName || current?.lastName || ''}`.trim()
    }

    const { data, error } = await supabase
      .from('Player')
      .update(updateData)
      .eq('id', playerId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[API player/profile PATCH] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
