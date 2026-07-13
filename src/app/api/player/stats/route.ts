import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'

const MAX_STAT = 99
const STAT_KEYS = ['basePAC', 'baseSHO', 'basePAS', 'baseDRI', 'baseDEF', 'basePHY'] as const

/**
 * POST /api/player/stats
 * Distribuye puntos disponibles en atributos.
 * Body: { pac: 5, sho: 3, pas: 0, dri: 2, def: 0, phy: 1 }
 * Cada valor es cuántos puntos asignar a ese stat.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { pac, sho, pas, dri, def, phy } = body

    const allocations = { basePAC: pac || 0, baseSHO: sho || 0, basePAS: pas || 0, baseDRI: dri || 0, baseDEF: def || 0, basePHY: phy || 0 }
    const totalRequested = Object.values(allocations).reduce((a: number, b: number) => a + b, 0)

    if (totalRequested <= 0) {
      return NextResponse.json({ error: 'Debes asignar al menos 1 punto' }, { status: 400 })
    }

    // Buscar player
    const { data: player } = await supabase
      .from('Player')
      .select('id, statPoints, basePAC, baseSHO, basePAS, baseDRI, baseDEF, basePHY')
      .eq('userId', session.user.id)
      .single()

    if (!player) return NextResponse.json({ error: 'No tienes perfil de jugador' }, { status: 400 })

    // Verificar puntos disponibles
    if (totalRequested > player.statPoints) {
      return NextResponse.json({
        error: `No tienes suficientes puntos. Disponibles: ${player.statPoints}, solicitados: ${totalRequested}`,
      }, { status: 400 })
    }

    // Verificar topes
    const update: any = { updatedAt: new Date().toISOString() }
    for (const key of STAT_KEYS) {
      const current = player[key] as number
      const adding = allocations[key]
      const newValue = current + adding
      if (newValue > MAX_STAT) {
        return NextResponse.json({
          error: `${key.replace('base', '')} llegaría a ${newValue}. Tope máximo: ${MAX_STAT}`,
        }, { status: 400 })
      }
      update[key] = newValue
    }

    // Restar puntos gastados
    update.statPoints = player.statPoints - totalRequested

    const { data, error } = await supabase
      .from('Player')
      .update(update)
      .eq('id', player.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      player: data,
      pointsSpent: totalRequested,
      pointsRemaining: update.statPoints,
      message: `${totalRequested} puntos distribuidos correctamente`,
    })
  } catch (error: any) {
    console.error('[API player/stats] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
