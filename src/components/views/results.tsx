'use client'

import { useAppStore } from '@/lib/store'
import { PlayerAvatar } from '@/components/app/player-avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Trophy, Goal, Hand, Clock, SquareDot, Shield, Star, Crown, Save,
  ChevronRight, MapPin, Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { TeamEvent, MatchStat, Player } from '@/lib/types'
import { formatDateLong } from '@/lib/helpers'

export function ResultsView() {
  const { events, matchStats, players, team } = useAppStore()
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [tab, setTab] = useState<'todos' | 'ganados' | 'empatados' | 'perdidos'>('todos')

  const completedMatches = useMemo(() => {
    return events
      .filter((e) => e.type === 'partido' && e.status === 'completado' && e.homeScore !== undefined)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [events])

  const filteredMatches = useMemo(() => {
    return completedMatches.filter((m) => {
      if (tab === 'todos') return true
      const ourScore = m.isHome ? m.homeScore : m.awayScore
      const oppScore = m.isHome ? m.awayScore : m.homeScore
      const isWin = (ourScore ?? 0) > (oppScore ?? 0)
      const isDraw = (ourScore ?? 0) === (oppScore ?? 0)
      if (tab === 'ganados') return isWin
      if (tab === 'empatados') return isDraw
      if (tab === 'perdidos') return (ourScore ?? 0) < (oppScore ?? 0)
      return true
    })
  }, [completedMatches, tab])

  // Estadísticas agregadas del equipo en la temporada
  const seasonStats = useMemo(() => {
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0
    completedMatches.forEach((m) => {
      const ourScore = (m.isHome ? m.homeScore : m.awayScore) ?? 0
      const oppScore = (m.isHome ? m.awayScore : m.homeScore) ?? 0
      goalsFor += ourScore
      goalsAgainst += oppScore
      if (ourScore > oppScore) wins++
      else if (ourScore === oppScore) draws++
      else losses++
    })
    return { wins, draws, losses, goalsFor, goalsAgainst, total: completedMatches.length }
  }, [completedMatches])

  // Top goleadores y asistidores
  const topScorers = useMemo(() => {
    const byPlayer: Record<string, number> = {}
    matchStats.forEach((s) => {
      byPlayer[s.playerId] = (byPlayer[s.playerId] || 0) + s.goals
    })
    return Object.entries(byPlayer)
      .map(([id, goals]) => ({ player: players.find((p) => p.id === id), goals }))
      .filter((x) => x.player)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5)
  }, [matchStats, players])

  const selectedEvent = events.find((e) => e.id === selectedEventId)

  return (
    <div className="space-y-4">
      {/* Stats de temporada */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <SeasonStat label="PJ" value={seasonStats.total} />
        <SeasonStat label="G" value={seasonStats.wins} color="text-emerald-600" />
        <SeasonStat label="E" value={seasonStats.draws} color="text-amber-600" />
        <SeasonStat label="P" value={seasonStats.losses} color="text-rose-600" />
        <SeasonStat label="GF" value={seasonStats.goalsFor} color="text-emerald-600" />
        <SeasonStat label="GC" value={seasonStats.goalsAgainst} color="text-rose-600" />
      </div>

      {/* Top goleadores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Goal className="h-4 w-4 text-rose-500" />
            Tabla de goleadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topScorers.map((s, idx) => (
              <div key={s.player!.id} className="flex items-center gap-3">
                <span className={cn(
                  'flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold',
                  idx === 0 ? 'bg-amber-500 text-white' :
                  idx === 1 ? 'bg-zinc-400 text-white' :
                  idx === 2 ? 'bg-amber-700 text-white' :
                  'bg-muted text-muted-foreground'
                )}>
                  {idx + 1}
                </span>
                <PlayerAvatar player={s.player!} size="sm" showNumber />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.player!.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.player!.primaryPosition}</p>
                </div>
                <span className="font-bold text-lg tabular-nums text-rose-600">{s.goals}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtros y lista de partidos */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="ganados">Ganados</TabsTrigger>
          <TabsTrigger value="empatados">Empates</TabsTrigger>
          <TabsTrigger value="perdidos">Perdidos</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {filteredMatches.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Trophy className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No hay partidos en esta categoría.</p>
              </CardContent>
            </Card>
          )}

          {filteredMatches.map((match) => {
            const ourScore = (match.isHome ? match.homeScore : match.awayScore) ?? 0
            const oppScore = (match.isHome ? match.awayScore : match.homeScore) ?? 0
            const isWin = ourScore > oppScore
            const isDraw = ourScore === oppScore
            const resultColor = isWin ? 'bg-emerald-500' : isDraw ? 'bg-amber-500' : 'bg-rose-500'
            const resultLabel = isWin ? 'G' : isDraw ? 'E' : 'P'

            // Estadísticas del partido
            const matchStatList = matchStats.filter((s) => s.eventId === match.id)
            const motm = matchStatList.find((s) => s.isMotm)
            const motmPlayer = motm ? players.find((p) => p.id === motm.playerId) : null
            const matchGoals = matchStatList.reduce((acc, s) => acc + s.goals, 0)
            const matchAssists = matchStatList.reduce((acc, s) => acc + s.assists, 0)

            return (
              <Card key={match.id} className="overflow-hidden">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-white text-sm font-bold shrink-0', resultColor)}>
                      {resultLabel}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-sm">
                          {match.isHome ? team.shortName : match.opponent}
                          <span className="text-muted-foreground mx-1.5 font-normal">vs</span>
                          {match.isHome ? match.opponent : team.shortName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDateLong(match.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {match.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Marcador */}
                  <div className="mt-3 flex items-center justify-center gap-6 py-3 rounded-lg bg-muted/50">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">
                        {match.isHome ? team.shortName : match.opponent}
                      </p>
                      <p className="text-3xl font-extrabold tabular-nums">
                        {match.isHome ? match.homeScore : match.awayScore}
                      </p>
                    </div>
                    <span className="text-xl text-muted-foreground">-</span>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">
                        {match.isHome ? match.opponent : team.shortName}
                      </p>
                      <p className="text-3xl font-extrabold tabular-nums">
                        {match.isHome ? match.awayScore : match.homeScore}
                      </p>
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30">
                      <p className="text-[10px] text-muted-foreground">Goles</p>
                      <p className="font-bold text-rose-600">{matchGoals}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                      <p className="text-[10px] text-muted-foreground">Asistencias</p>
                      <p className="font-bold text-emerald-600">{matchAssists}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                      <p className="text-[10px] text-muted-foreground">Figura</p>
                      {motmPlayer ? (
                        <p className="font-bold text-amber-600 text-xs truncate">{motmPlayer.name.split(' ')[0]}</p>
                      ) : (
                        <p className="font-bold text-muted-foreground text-xs">-</p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => setSelectedEventId(match.id)}
                  >
                    Editar estadísticas
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>

      {/* Modal de edición de estadísticas */}
      {selectedEvent && (
        <MatchStatsEditor
          event={selectedEvent}
          open={!!selectedEvent}
          onOpenChange={(open) => !open && setSelectedEventId(null)}
        />
      )}
    </div>
  )
}

function SeasonStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="p-2 rounded-lg border bg-card text-center">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className={cn('text-lg font-bold tabular-nums', color)}>{value}</p>
    </div>
  )
}

function MatchStatsEditor({
  event, open, onOpenChange,
}: {
  event: TeamEvent
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { matchStats, players, callups, upsertMatchStat, setMotm, setMatchResult } = useAppStore()
  const callup = callups.find((c) => c.eventId === event.id)
  const calledPlayerIds = callup?.calledUpPlayerIds || []
  // Si no hay convocatoria, mostrar todos los jugadores
  const playersInMatch = calledPlayerIds.length > 0
    ? calledPlayerIds.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[]
    : players.slice(0, 14)

  const [homeScore, setHomeScore] = useState(event.homeScore ?? 0)
  const [awayScore, setAwayScore] = useState(event.awayScore ?? 0)
  const [stats, setStats] = useState<Record<string, MatchStat>>(() => {
    const map: Record<string, MatchStat> = {}
    matchStats.filter((s) => s.eventId === event.id).forEach((s) => {
      map[s.playerId] = { ...s }
    })
    // Inicializar jugadores sin stats
    playersInMatch.forEach((p) => {
      if (!map[p.id]) {
        map[p.id] = {
          id: `s_${event.id}_${p.id}`,
          eventId: event.id,
          playerId: p.id,
          goals: 0, assists: 0, minutesPlayed: 0,
          yellowCards: 0, redCards: 0, saves: 0, shots: 0, recoveries: 0,
          isMotm: false,
        }
      }
    })
    return map
  })

  const handleSave = () => {
    setMatchResult(event.id, homeScore, awayScore)
    Object.values(stats).forEach((s) => upsertMatchStat(s))
    toast.success('Estadísticas guardadas', {
      description: `${event.title}: ${homeScore}-${awayScore}`,
    })
    onOpenChange(false)
  }

  const motmId = Object.values(stats).find((s) => s.isMotm)?.playerId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Estadísticas del partido
          </DialogTitle>
          <DialogDescription className="sr-only">
            Editar marcador y estadísticas individuales de los jugadores
          </DialogDescription>
        </DialogHeader>

        {/* Marcador */}
        <div className="flex items-center justify-center gap-3 py-3 rounded-lg bg-muted">
          <Input
            type="number"
            min="0"
            value={homeScore}
            onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
            className="w-16 text-center text-2xl font-bold h-14"
          />
          <span className="text-xl text-muted-foreground">-</span>
          <Input
            type="number"
            min="0"
            value={awayScore}
            onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
            className="w-16 text-center text-2xl font-bold h-14"
          />
        </div>
        <p className="text-xs text-center text-muted-foreground">
          {event.isHome ? `${useAppStore.getState().team.shortName} (local) - ${event.opponent} (visitante)` : `${event.opponent} (local) - ${useAppStore.getState().team.shortName} (visitante)`}
        </p>

        {/* Lista de jugadores con stats */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto scroll-area">
          {playersInMatch.map((p) => {
            const s = stats[p.id]
            if (!s) return null
            return (
              <div key={p.id} className="p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <PlayerAvatar player={p} size="sm" showNumber />
                  <span className="font-medium text-sm flex-1 truncate">{p.name}</span>
                  <button
                    onClick={() => {
                      setStats((prev) => {
                        const updated = { ...prev }
                        Object.values(updated).forEach((st) => {
                          if (st.playerId === p.id) st.isMotm = true
                          else st.isMotm = false
                        })
                        return updated
                      })
                    }}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded',
                      s.isMotm ? 'text-amber-500' : 'text-muted-foreground hover:bg-muted'
                    )}
                    title="Marcar como figura"
                  >
                    <Star className={cn('h-4 w-4', s.isMotm && 'fill-current')} />
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  <StatInput
                    label="Goles" value={s.goals}
                    onChange={(v) => setStats((prev) => ({ ...prev, [p.id]: { ...prev[p.id], goals: v } }))}
                    color="text-rose-600"
                  />
                  <StatInput
                    label="Asist." value={s.assists}
                    onChange={(v) => setStats((prev) => ({ ...prev, [p.id]: { ...prev[p.id], assists: v } }))}
                    color="text-emerald-600"
                  />
                  <StatInput
                    label="Min." value={s.minutesPlayed}
                    onChange={(v) => setStats((prev) => ({ ...prev, [p.id]: { ...prev[p.id], minutesPlayed: v } }))}
                  />
                  <StatInput
                    label="TA" value={s.yellowCards}
                    onChange={(v) => setStats((prev) => ({ ...prev, [p.id]: { ...prev[p.id], yellowCards: v } }))}
                    color="text-amber-600"
                  />
                  <StatInput
                    label="TR" value={s.redCards}
                    onChange={(v) => setStats((prev) => ({ ...prev, [p.id]: { ...prev[p.id], redCards: v } }))}
                    color="text-rose-600"
                  />
                  {p.primaryPosition === 'Portero' && (
                    <StatInput
                      label="Ataj." value={s.saves}
                      onChange={(v) => setStats((prev) => ({ ...prev, [p.id]: { ...prev[p.id], saves: v } }))}
                    />
                  )}
                  <StatInput
                    label="Tiros" value={s.shots}
                    onChange={(v) => setStats((prev) => ({ ...prev, [p.id]: { ...prev[p.id], shots: v } }))}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Guardar estadísticas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatInput({
  label, value, onChange, color,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  color?: string
}) {
  return (
    <div>
      <p className="text-[9px] text-muted-foreground uppercase text-center mb-0.5">{label}</p>
      <Input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className={cn('h-8 text-center text-sm font-bold tabular-nums p-0', color)}
      />
    </div>
  )
}
