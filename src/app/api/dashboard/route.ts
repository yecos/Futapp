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

    const teamId = session.user.teamId
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

    // Obtener próximo evento
    const { data: nextEvent } = await supabase
      .from('Event')
      .select('title, date, location, type')
      .eq('teamId', teamId)
      .gte('date', now)
      .eq('status', 'PROGRAMADO')
      .order('date', { ascending: true })
      .limit(1)
      .single()

    // Top goleador
    const { data: topScorer } = await supabase
      .from('Player')
      .select('fullName, goals, jerseyNumber')
      .eq('teamId', teamId)
      .order('goals', { ascending: false })
      .limit(1)
      .single()

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
      totalPayments: totalPayments || 0,
      totalRecaudado,
      nextEvent: nextEvent || null,
      topScorer: topScorer || null,
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
