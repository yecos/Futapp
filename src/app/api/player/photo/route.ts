import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

/**
 * POST /api/player/photo
 * Sube la foto de perfil del jugador.
 * La foto se guarda como base64 en la columna photoUrl.
 * En futuro: migrar a Supabase Storage.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const playerId = formData.get('playerId') as string

    if (!file) {
      return NextResponse.json({ error: 'Archivo no proporcionado' }, { status: 400 })
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo no permitido' }, { status: 400 })
    }

    // Validar tamaño (3MB)
    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json({ error: 'Máximo 3MB' }, { status: 400 })
    }

    // Convertir a base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Si tiene playerId, actualizar el Player existente
    if (playerId) {
      // Verificar que el player pertenece al usuario
      const { data: player } = await supabase
        .from('Player')
        .select('id, userId')
        .eq('id', playerId)
        .single()

      if (!player) {
        return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
      }

      // Solo el propio usuario o admin puede cambiar la foto
      const { data: membership } = await supabase
        .from('TeamMembership')
        .select('role')
        .eq('userId', session.user.id)
        .eq('status', 'ACTIVO')
        .single()

      if (player.userId !== session.user.id && membership?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
      }

      const { error } = await supabase
        .from('Player')
        .update({ photoUrl: dataUrl, updatedAt: new Date().toISOString() })
        .eq('id', playerId)

      if (error) throw error
    } else {
      // No tiene player aún — guardar en el User
      // (se transferirá cuando cree el player)
      // Por ahora guardamos en una variable temporal
      // En realidad, si no hay player, no podemos guardar la foto todavía
      return NextResponse.json({ error: 'Primero guarda tu perfil' }, { status: 400 })
    }

    return NextResponse.json({ success: true, photoUrl: dataUrl })
  } catch (error: any) {
    console.error('[API player/photo] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
