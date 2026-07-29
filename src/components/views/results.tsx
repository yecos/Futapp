'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { LoadResultDialog } from '@/components/match-stats/load-result-dialog'
import { toast } from 'sonner'

interface MatchData {
  id: string
  type: string
  title: string
  date: string
  opponent: string | null
  isHome: boolean | null
  status: string
  homeScore: number | null
  awayScore: number | null
  location: string
}

interface StatData {
  id: string
  eventId: string
  playerId: string
  goals: number
  assists: number
  minutesPlayed: number
  yellowCards: number
  redCards: number
  isMotm: boolean
  player: { id: string; fullName: string; jerseyNumber: number }
}

interface Player {
  id: string
  fullName: string
  jerseyNumber: number
  primaryPosition: string
}

export function ResultsView({ matches, stats }: { matches: MatchData[]; stats: StatData[] }) {
  const { data: session } = useSession()
  const [allMatches, setAllMatches] = useState(matches)
  const [allStats, setAllStats] = useState(stats)
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null)

  // Cargar jugadores del equipo si el usuario es staff
  const canManage = ['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(session?.user?.role || '')

  useEffect(() => {
    if (canManage && players.length === 0) {
      fetch('/api/players')
        .then(res => res.ok ? res.json() : [])
        .then(data => setPlayers(data))
        .catch(() => {})
    }
  }, [canManage, players.length])

  const wins = allMatches.filter(m => {
    const our = m.isHome ? m.homeScore : m.awayScore
    const opp = m.isHome ? m.awayScore : m.homeScore
    return our !== null && opp !== null && our > opp
  }).length
  const draws = allMatches.filter(m => m.homeScore === m.awayScore && m.homeScore !== null).length
  const losses = allMatches.filter(m => {
    const our = m.isHome ? m.homeScore : m.awayScore
    const opp = m.isHome ? m.awayScore : m.homeScore
    return our !== null && opp !== null && our < opp
  }).length
  const goalsFor = allMatches.reduce((sum, m) => sum + ((m.isHome ? m.homeScore : m.awayScore) || 0), 0)
  const goalsAgainst = allMatches.reduce((sum, m) => sum + ((m.isHome ? m.awayScore : m.homeScore) || 0), 0)

  // Top goleadores
  const scorerStats: Record<string, { id: string; name: string; number: number; goals: number; assists: number }> = {}
  allStats.forEach(s => {
    if (!scorerStats[s.playerId]) {
      scorerStats[s.playerId] = {
        id: s.player.id,
        name: s.player.fullName,
        number: s.player.jerseyNumber,
        goals: 0,
        assists: 0,
      }
    }
    scorerStats[s.playerId].goals += s.goals
    scorerStats[s.playerId].assists += s.assists
  })
  const topScorers = Object.values(scorerStats).sort((a, b) => b.goals - a.goals).slice(0, 5)

  // Partidos sin resultado (para staff)
  const pendingMatches = allMatches.filter(m => m.homeScore === null && m.type === 'PARTIDO')

  const handleResultSaved = () => {
    // Refrescar la página para obtener nuevos datos
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
          <h1 className="text-xl font-bold mt-2">Resultados</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-24">
        {/* Stats de temporada */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          <Card className="border-white/5"><CardContent className="p-2 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">PJ</p>
            <p className="text-lg font-bold">{allMatches.length}</p>
          </CardContent></Card>
          <Card className="border-white/5"><CardContent className="p-2 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">G</p>
            <p className="text-lg font-bold text-emerald-400">{wins}</p>
          </CardContent></Card>
          <Card className="border-white/5"><CardContent className="p-2 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">E</p>
            <p className="text-lg font-bold text-amber-400">{draws}</p>
          </CardContent></Card>
          <Card className="border-white/5"><CardContent className="p-2 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">P</p>
            <p className="text-lg font-bold text-rose-400">{losses}</p>
          </CardContent></Card>
          <Card className="border-white/5"><CardContent className="p-2 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">GF</p>
            <p className="text-lg font-bold">{goalsFor}</p>
          </CardContent></Card>
        </div>

        {/* Partidos pendientes de cargar resultado (staff) */}
        {canManage && pendingMatches.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-950/20 mb-6">
            <CardContent className="p-4">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                Partidos sin cargar resultado ({pendingMatches.length})
              </h3>
              <div className="space-y-2">
                {pendingMatches.slice(0, 5).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded bg-card/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(m.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · {m.location}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setSelectedMatch(m)}
                    >
                      Cargar resultado
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top goleadores */}
        {topScorers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" /> Tabla de goleadores
            </h3>
            <div className="space-y-2">
              {topScorers.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-card/50">
                  <span className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold ${i === 0 ? 'bg-amber-500 text-amber-900' : i === 1 ? 'bg-zinc-400 text-zinc-900' : i === 2 ? 'bg-amber-700 text-amber-100' : 'bg-muted text-muted-foreground'}`}>
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium flex-1">#{s.number} {s.name}</span>
                  <span className="text-lg font-bold text-rose-400">{s.goals}</span>
                  <span className="text-[10px] text-muted-foreground">goles</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Partidos */}
        <div className="space-y-3">
          {allMatches.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Trophy className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No hay partidos completados.</p>
            </CardContent></Card>
          )}
          {allMatches.map((m, i) => {
            const ourScore = m.isHome ? m.homeScore : m.awayScore
            const oppScore = m.isHome ? m.awayScore : m.homeScore
            const isWin = (ourScore ?? 0) > (oppScore ?? 0)
            const isDraw = ourScore === oppScore && ourScore !== null
            return (
              <Card key={m.id} className="border-white/5 bg-gradient-card card-hover animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-lg font-black text-sm ${isWin ? 'bg-emerald-500/20 text-emerald-400' : isDraw ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {isWin ? 'G' : isDraw ? 'E' : 'P'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{m.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · {m.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold tabular-nums">
                        {ourScore ?? '-'} - {oppScore ?? '-'}
                      </p>
                      {canManage && m.homeScore === null && (
                        <Button size="sm" variant="outline" className="mt-1 h-7 text-xs" onClick={() => setSelectedMatch(m)}>
                          Cargar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>

      {selectedMatch && (
        <LoadResultDialog
          open={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          eventId={selectedMatch.id}
          eventTitle={selectedMatch.title}
          isHome={selectedMatch.isHome ?? true}
          opponent={selectedMatch.opponent}
          players={players}
          onSaved={handleResultSaved}
        />
      )}
    </div>
  )
}
