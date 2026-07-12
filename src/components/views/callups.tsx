'use client'

import { useAppStore } from '@/lib/store'
import { PlayerAvatar } from '@/components/app/player-avatar'
import { FootballField } from '@/components/app/football-field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ClipboardList, Users, Crown, Star, ChevronDown, StarIcon, X, Check, Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useState, useMemo } from 'react'
import { Player, Callup } from '@/lib/types'
import { FORMATIONS, eventTypeLabel, eventTypeColor, formatDateLong } from '@/lib/helpers'

export function CallupsView() {
  const {
    events, players, callups, selectedEventId, setSelectedEventId,
    toggleCallup, setStarter, setSubstitute, removePlayerFromCallup,
    setCaptain, setFormation, setPlayerPosition, addAnnouncement,
  } = useAppStore()

  // Eventos que son partidos (tienen convocatoria)
  const matches = useMemo(() => {
    return events
      .filter((e) => e.type === 'partido')
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [events])

  // Asegurar que hay un evento seleccionado: priorizar próximo partido, luego último jugado
  const currentEventId = useMemo(() => {
    if (selectedEventId && matches.find((m) => m.id === selectedEventId)) {
      return selectedEventId
    }
    // Próximo partido programado
    const upcoming = matches.filter((m) => m.status === 'programado')
    if (upcoming.length > 0) return upcoming[0].id
    // Último partido completado
    const completed = matches.filter((m) => m.status === 'completado')
    if (completed.length > 0) return completed[completed.length - 1].id
    return matches[0]?.id
  }, [matches, selectedEventId])
  const currentEvent = events.find((e) => e.id === currentEventId)
  const callup: Callup | undefined = callups.find((c) => c.eventId === currentEventId)

  if (!currentEvent) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No hay partidos programados para crear convocatorias.</p>
        </CardContent>
      </Card>
    )
  }

  // Lista de jugadores disponibles (no lesionados ni suspendidos) ordenados por dorsal
  const availablePlayers = players
    .filter((p) => p.status === 'disponible')
    .sort((a, b) => a.jerseyNumber - b.jerseyNumber)

  const calledUpIds = callup?.calledUpPlayerIds || []
  const startingIds = callup?.startingIds || []
  const substituteIds = callup?.substituteIds || []
  const captainId = callup?.captainId
  const formation = callup?.formation || '4-3-3'
  const positions = callup?.positions || {}

  const starters = startingIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as Player[]
  const substitutes = substituteIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as Player[]
  const notCalledUp = availablePlayers.filter((p) => !calledUpIds.includes(p.id))

  return (
    <div className="space-y-4">
      {/* Selector de partido */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Partido</p>
              <Select value={currentEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {matches.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      vs {m.opponent} · {formatDateLong(m.date).slice(0, -5)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('text-[10px]', eventTypeColor(currentEvent.type))}>
                {eventTypeLabel(currentEvent.type)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {currentEvent.isHome ? 'Local' : 'Visitante'} · {currentEvent.time}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Columna izquierda: Cancha + formación */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Alineación titular</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Formación:</span>
                  <Select value={formation} onValueChange={(v) => setFormation(currentEventId!, v)}>
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATIONS.map((f) => (
                        <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FootballField
                formation={formation}
                startingPlayers={starters}
                positions={positions}
                captainId={captainId}
              />
              {starters.length < 11 && (
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Asigna titulares desde la lista de la derecha. Faltan {11 - starters.length} jugadores.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Banca */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Suplentes
                <Badge variant="secondary" className="ml-auto">{substitutes.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {substitutes.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No hay suplentes asignados.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {substitutes.map((p) => (
                    <SubstituteChip
                      key={p.id}
                      player={p}
                      isCaptain={captainId === p.id}
                      onMakeCaptain={() => setCaptain(currentEventId!, p.id)}
                      onMakeStarter={() => {
                        if (startingIds.length >= 11) {
                          toast.error('Ya hay 11 titulares', {
                            description: 'Quita un titular antes de agregar otro.',
                          })
                          return
                        }
                        setStarter(currentEventId!, p.id)
                        toast.success(`${p.name.split(' ')[0]} ahora es titular`)
                      }}
                      onRemove={() => {
                        removePlayerFromCallup(currentEventId!, p.id)
                        toast.info(`${p.name.split(' ')[0]} retirado de la convocatoria`)
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botón enviar convocatoria */}
          <Button
            className="w-full"
            size="lg"
            disabled={calledUpIds.length === 0}
            onClick={() => {
              addAnnouncement({
                title: `Convocatoria vs ${currentEvent.opponent}`,
                content: `Ya está disponible la convocatoria para el partido vs ${currentEvent.opponent} (${formatDateLong(currentEvent.date)}). Titulares: ${starters.map((p) => `#${p.jerseyNumber} ${p.name.split(' ')[0]}`).join(', ')}. Suplentes: ${substitutes.map((p) => `#${p.jerseyNumber} ${p.name.split(' ')[0]}`).join(', ') || 'Ninguno'}.`,
                author: 'Carlos Mendoza',
                authorRole: 'entrenador',
                pinned: true,
                category: 'convocatoria',
              })
              toast.success('Convocatoria enviada', {
                description: 'Se publicó un aviso para todo el equipo.',
              })
            }}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar convocatoria al equipo
          </Button>
        </div>

        {/* Columna derecha: Listas */}
        <div className="lg:col-span-2 space-y-4">
          {/* Titulares */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Titulares
                </CardTitle>
                <Badge variant={startingIds.length === 11 ? 'default' : 'secondary'} className="text-xs">
                  {startingIds.length}/11
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-80 overflow-y-auto scroll-area">
              {starters.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Selecciona jugadores titulares.
                </p>
              )}
              {starters.map((p) => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  position={positions[p.id]}
                  isCaptain={captainId === p.id}
                  onSetCaptain={() => setCaptain(currentEventId!, p.id)}
                  onMoveToSub={() => setSubstitute(currentEventId!, p.id)}
                  onRemove={() => {
                    removePlayerFromCallup(currentEventId!, p.id)
                    toast.info(`${p.name.split(' ')[0]} retirado`)
                  }}
                  onSetPosition={(pos) => setPlayerPosition(currentEventId!, p.id, pos)}
                />
              ))}
            </CardContent>
          </Card>

          {/* Disponibles (no convocados) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Disponibles ({notCalledUp.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto scroll-area">
              {notCalledUp.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Todos los jugadores disponibles están convocados.
                </p>
              )}
              {notCalledUp.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    toggleCallup(currentEventId!, p.id)
                    setSubstitute(currentEventId!, p.id)
                    toast.success(`${p.name.split(' ')[0]} convocado (suplente)`)
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/60 transition-colors text-left"
                >
                  <PlayerAvatar player={p} size="sm" showNumber />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.primaryPosition}</p>
                  </div>
                  <span className="text-xs text-primary font-medium">+ Convocar</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PlayerRow({
  player, position, isCaptain, onSetCaptain, onMoveToSub, onRemove, onSetPosition,
}: {
  player: Player
  position?: string
  isCaptain: boolean
  onSetCaptain: () => void
  onMoveToSub: () => void
  onRemove: () => void
  onSetPosition: (pos: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted transition-colors">
      <PlayerAvatar player={player} size="sm" showNumber />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">
          {player.name}
          {isCaptain && <Crown className="inline h-3 w-3 text-amber-500 ml-1" />}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          {position ? (
            <Badge variant="secondary" className="text-[9px] h-4 px-1">
              {position}
            </Badge>
          ) : (
            <span className="text-[10px] text-amber-600">Sin posición</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={onSetCaptain}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded hover:bg-amber-100 dark:hover:bg-amber-950',
            isCaptain ? 'text-amber-500' : 'text-muted-foreground'
          )}
          title="Hacer capitán"
        >
          <Crown className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onMoveToSub}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted text-muted-foreground"
          title="Mover a suplente"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onRemove}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-muted-foreground hover:text-rose-600"
          title="Quitar de la convocatoria"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function SubstituteChip({
  player, isCaptain, onMakeCaptain, onMakeStarter, onRemove,
}: {
  player: Player
  isCaptain: boolean
  onMakeCaptain: () => void
  onMakeStarter: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-1.5 p-1.5 pr-2 rounded-full bg-muted border">
      <PlayerAvatar player={player} size="sm" />
      <span className="text-xs font-medium">
        {player.name.split(' ')[0]}
        <span className="text-muted-foreground ml-1">#{player.jerseyNumber}</span>
      </span>
      {isCaptain && <Crown className="h-3 w-3 text-amber-500" />}
      <div className="flex items-center gap-0.5 ml-1">
        <button
          onClick={onMakeStarter}
          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-950 text-emerald-600"
          title="Hacer titular"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={onMakeCaptain}
          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-amber-100 dark:hover:bg-amber-950 text-amber-600"
          title="Hacer capitán"
        >
          <Crown className="h-3 w-3" />
        </button>
        <button
          onClick={onRemove}
          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600"
          title="Quitar"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
