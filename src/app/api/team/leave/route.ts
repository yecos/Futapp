import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'

/**
 * POST /api/team/leave
 * Permite al usuario salir de su team membership actual.
 * Útil para usuarios que están PENDIENTE y quieren crear su propio equipo.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!session.user.teamId) {
      return NextResponse.json({ error: 'No tienes equipo' }, { status: 400 })
    }

    // Eliminar el membership actual
    const { error } = await supabase
      .from('TeamMembership')
      .delete()
      .eq('userId', session.user.id)
      .eq('teamId', session.user.teamId)

    if (error) {
      console.error('[API team/leave] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API team/leave] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
