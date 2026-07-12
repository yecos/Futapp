'use client'

import { useAppStore } from '@/lib/store'
import {
  countAttendances, daysUntil, eventTypeColor, eventTypeLabel, formatDate,
  formatDateLong, formatRelative, isPast, isUpcoming, statusBadgeClass, statusLabel,
} from '@/lib/helpers'
import { PlayerAvatar } from '@/components/app/player-avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Calendar, MapPin, Clock, Users, TrendingUp, Pin, ChevronRight,
  Trophy, CheckCircle2, XCircle, HelpCircle, Pin as PinIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function DashboardView() {
  const { events, attendances, announcements, standings, players, team, setActiveView, setSelectedEventId } = useAppStore()

  // Próximos eventos (ordenados por fecha)
  const upcomingEvents = events
    .filter((e) => isUpcoming(e))
    .sort((a, b) => a.date.localeCompare(b.date))

  const nextEvent = upcomingEvents[0]
  const nextMatch = upcomingEvents.find((e) => e.type === 'partido')

  // Últimos resultados (partidos completados)
  const pastMatches = events
    .filter((e) => e.type === 'partido' && isPast(e) && e.homeScore !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

  // Avisos fijados
  const pinnedAnnouncements = announcements.filter((a) => a.pinned).slice(0, 2)

  // Tabla de posiciones (primeros 5)
  const topStandings = [...standings]
    .sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst))
    .slice(0, 5)

  // Próximo evento - jugadores confirmados
  const nextEventAtt = nextEvent ? countAttendances(attendances, nextEvent.id) : null
  const confirmedPlayers = nextEvent
    ? attendances
        .filter((a) => a.eventId === nextEvent.id && a.status === 'asistire')
        .map((a) => players.find((p) => p.id === a.playerId))
        .filter(Boolean)
    : []

  return (
    <div className="space-y-6">
      {/* Hero - próximo partido */}
      {nextMatch && (
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardContent className="p-0">
            <div className="relative">
              <div className="absolute inset-0 field-pattern opacity-50" />
              <div className="relative p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20">
                    <Trophy className="h-3 w-3 mr-1" />
                    Próximo partido
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {daysUntil(nextMatch.date) === 0
                      ? '¡Hoy!'
                      : daysUntil(nextMatch.date) === 1
                      ? 'Mañana'
                      : `En ${daysUntil(nextMatch.date)} días`}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
                  {team.shortName} <span className="text-muted-foreground mx-2 text-lg">vs</span>{' '}
                  {nextMatch.opponent}
                </h2>
                <p className="text-sm text-muted-foreground mb-4 capitalize">
                  {formatDateLong(nextMatch.date)}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{nextMatch.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="truncate">{nextMatch.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{nextMatch.isHome ? 'Local' : 'Visitante'}</span>
                  </div>
                </div>

                <Button
                  className="mt-5 w-full sm:w-auto"
                  onClick={() => {
                    setSelectedEventId(nextMatch.id)
                    setActiveView('convocatorias')
                  }}
                >
                  Ver convocatoria
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Próximo evento / entrenamiento */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Próximo evento
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setActiveView('calendario')}>
                Ver todo
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextEvent ? (
              <>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex flex-col items-center justify-center w-14 shrink-0 rounded-lg bg-primary text-primary-foreground py-2">
                    <span className="text-[10px] font-medium uppercase">
                      {new Date(nextEvent.date + 'T00:00:00').toLocaleDateString('es-CO', { month: 'short' })}
                    </span>
                    <span className="text-xl font-extrabold leading-none">
                      {new Date(nextEvent.date + 'T00:00:00').getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={cn('text-[10px]', eventTypeColor(nextEvent.type))}>
                        {eventTypeLabel(nextEvent.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{nextEvent.time}</span>
                    </div>
                    <h3 className="font-semibold text-sm truncate">{nextEvent.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{nextEvent.location}</span>
                    </div>
                  </div>
                </div>

                {/* Confirmados */}
                {nextEventAtt && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground">Confirmaciones</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {nextEventAtt.yes}
                        </span>
                        <span className="flex items-center gap-1 text-amber-600">
                          <HelpCircle className="h-3.5 w-3.5" /> {nextEventAtt.maybe}
                        </span>
                        <span className="flex items-center gap-1 text-rose-600">
                          <XCircle className="h-3.5 w-3.5" /> {nextEventAtt.no}
                        </span>
                      </div>
                    </div>
                    {confirmedPlayers.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {confirmedPlayers.slice(0, 12).map((p) => p && (
                          <PlayerAvatar key={p.id} player={p} size="sm" showNumber showStatus />
                        ))}
                        {confirmedPlayers.length > 12 && (
                          <div className="flex h-8 items-center px-2 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            +{confirmedPlayers.length - 12}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Aún no hay confirmaciones.</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No hay eventos próximos.</p>
            )}
          </CardContent>
        </Card>

        {/* Últimos resultados */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Últimos resultados
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setActiveView('resultados')}>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pastMatches.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay resultados registrados.</p>
            )}
            {pastMatches.map((m) => {
              const ourScore = m.isHome ? m.homeScore : m.awayScore
              const oppScore = m.isHome ? m.awayScore : m.homeScore
              const isWin = (ourScore ?? 0) > (oppScore ?? 0)
              const isDraw = (ourScore ?? 0) === (oppScore ?? 0)
              const resultColor = isWin
                ? 'bg-emerald-500'
                : isDraw
                ? 'bg-amber-500'
                : 'bg-rose-500'
              const resultLabel = isWin ? 'G' : isDraw ? 'E' : 'P'
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className={cn('flex h-7 w-7 items-center justify-center rounded text-white text-xs font-bold', resultColor)}>
                    {resultLabel}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {m.isHome ? team.shortName : m.opponent} <span className="text-muted-foreground">vs</span>{' '}
                      {m.isHome ? m.opponent : team.shortName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(m.date)}</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums">
                    {ourScore} - {oppScore}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Avisos importantes */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <PinIcon className="h-4 w-4 text-primary" />
                Avisos importantes
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setActiveView('avisos')}>
                Ver todos
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pinnedAnnouncements.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay avisos fijados.</p>
            )}
            {pinnedAnnouncements.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <Pin className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatRelative(a.date)} · {a.author}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tabla de posiciones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Tabla de posiciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {topStandings.map((s, idx) => (
                <div
                  key={s.teamName}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded text-sm',
                    s.isOurTeam && 'bg-primary/10 border border-primary/20'
                  )}
                >
                  <span className={cn(
                    'flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold',
                    idx === 0 ? 'bg-amber-500 text-white' :
                    idx === 1 ? 'bg-zinc-400 text-white' :
                    idx === 2 ? 'bg-amber-700 text-white' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {idx + 1}
                  </span>
                  <span className={cn('flex-1 truncate text-xs', s.isOurTeam && 'font-bold')}>
                    {s.teamName}
                  </span>
                  <span className="text-xs font-bold tabular-nums">{s.points} pts</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado de jugadores */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Estado de la plantilla</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setActiveView('plantilla')}>
              Ver plantilla
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['disponible', 'lesionado', 'suspendido', 'ausente'] as const).map((status) => {
              const count = players.filter((p) => p.status === status).length
              return (
                <div key={status} className="flex flex-col gap-1 p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{statusLabel(status)}</span>
                    <span className={cn('h-2 w-2 rounded-full', statusBadgeClass(status).split(' ')[0])} />
                  </div>
                  <span className="text-2xl font-bold tabular-nums">{count}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
