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

    // Consultar membership directamente desde la DB (no del JWT)
    // Incluir tanto ACTIVO como PENDIENTE (usuarios pendientes también pueden salir)
    const { data: memberships } = await supabase
      .from('TeamMembership')
      .select('role, teamId, status')
      .eq('userId', session.user.id)
      .in('status', ['ACTIVO', 'PENDIENTE'])
      .order('joinedAt', { ascending: false })
      .limit(1)

    const membership = memberships?.[0]
    if (!membership?.teamId) {
      return NextResponse.json({ error: 'No tienes equipo' }, { status: 400 })
    }

    // Si es ADMIN ACTIVO, verificar que no sea el único admin del equipo
    if (membership.role === 'ADMIN' && membership.status === 'ACTIVO') {
      const { count: adminCount } = await supabase
        .from('TeamMembership')
        .select('*', { count: 'exact', head: true })
        .eq('teamId', membership.teamId)
        .eq('role', 'ADMIN')
        .eq('status', 'ACTIVO')

      if (adminCount && adminCount <= 1) {
        return NextResponse.json(
          { error: 'Eres el único administrador del equipo. Asigna otro admin antes de salir.' },
          { status: 400 }
        )
      }
    }

    // Marcar el membership como RETIRADO (preserva auditoría)
    const { error } = await supabase
      .from('TeamMembership')
      .update({
        status: 'RETIRADO',
        leftAt: new Date().toISOString(),
      })
      .eq('userId', session.user.id)
      .eq('teamId', membership.teamId)

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
