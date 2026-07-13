import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Consultar teamId directamente desde la DB (no del JWT)
    const { data: memberships } = await supabase
      .from('TeamMembership')
      .select('teamId, role')
      .eq('userId', session.user.id)
      .eq('status', 'ACTIVO')
      .order('joinedAt', { ascending: false })
      .limit(1)

    const teamId = memberships?.[0]?.teamId
    if (!teamId) {
      return NextResponse.json({ error: 'Sin equipo' }, { status: 400 })
    }

    // Contar jugadores
    const { count: totalPlayers } = await supabase
      .from('Player')
      .select('*', { count: 'exact', head: true })
      .eq('teamId', teamId)

    // Contar eventos próximos
    const now = new Date().toISOString()
    const { count: totalEvents } = await supabase
      .from('Event')
      .select('*', { count: 'exact', head: true })
      .eq('teamId', teamId)
      .gte('date', now)
      .eq('status', 'PROGRAMADO')

    // Contar TODOS los eventos (para mostrar más info)
    const { count: allEvents } = await supabase
      .from('Event')
      .select('*', { count: 'exact', head: true })
      .eq('teamId', teamId)

    // Obtener próximo evento
    const { data: nextEvents } = await supabase
      .from('Event')
      .select('title, date, location, type')
      .eq('teamId', teamId)
      .gte('date', now)
      .eq('status', 'PROGRAMADO')
      .order('date', { ascending: true })
      .limit(1)

    const nextEvent = nextEvents?.[0] || null

    // Top goleador
    const { data: topScorers } = await supabase
      .from('Player')
      .select('fullName, goals, jerseyNumber')
      .eq('teamId', teamId)
      .order('goals', { ascending: false })
      .limit(1)

    const topScorer = topScorers?.[0] || null

    // Pagos pendientes
    const { count: totalPayments } = await supabase
      .from('Payment')
      .select('*', { count: 'exact', head: true })
      .eq('teamId', teamId)
      .eq('status', 'PENDIENTE')

    // Total recaudado (verificado)
    const { data: verifiedPayments } = await supabase
      .from('PaymentReceipt')
      .select('amount')
      .eq('teamId', teamId)
      .eq('status', 'VERIFICADO')

    const totalRecaudado = (verifiedPayments || []).reduce(
      (sum: number, r: any) => sum + Number(r.amount || 0),
      0
    )

    // Últimos resultados (partidos completados)
    const { data: recentMatches } = await supabase
      .from('Event')
      .select('title, homeScore, awayScore, isHome')
      .eq('teamId', teamId)
      .eq('status', 'COMPLETADO')
      .not('homeScore', 'is', null)
      .order('date', { ascending: false })
      .limit(3)

    const recentResults = (recentMatches || []).map((m: any) => {
      const ourScore = m.isHome ? m.homeScore : m.awayScore
      const oppScore = m.isHome ? m.awayScore : m.homeScore
      return {
        title: m.title,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        isWin: ourScore > oppScore,
        isDraw: ourScore === oppScore,
      }
    })

    return NextResponse.json({
      totalPlayers: totalPlayers || 0,
      totalEvents: totalEvents || 0,
      allEvents: allEvents || 0,
      totalPayments: totalPayments || 0,
      totalRecaudado,
      nextEvent,
      topScorer,
      recentResults,
    })
  } catch (error: any) {
    console.error('[API dashboard] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
