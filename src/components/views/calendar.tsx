'use client'

import { useAppStore } from '@/lib/store'
import {
  countAttendances, daysUntil, eventTypeColor, eventTypeLabel, formatDate,
  formatDateLong, isPast, isUpcoming,
} from '@/lib/helpers'
import { PlayerAvatar } from '@/components/app/player-avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Calendar, Clock, MapPin, Users, CheckCircle2, XCircle, HelpCircle,
  ChevronRight, Plus, Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'
import { AttendanceStatus, TeamEvent } from '@/lib/types'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export function CalendarView() {
  const { events, attendances, players, currentUserId, setAttendance, addEvent, setActiveView, setSelectedEventId } = useAppStore()
  const [tab, setTab] = useState<'proximos' | 'pasados'>('proximos')
  const [showNewEvent, setShowNewEvent] = useState(false)
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)

  const upcomingEvents = events
    .filter((e) => isUpcoming(e))
    .sort((a, b) => a.date.localeCompare(b.date))
  const pastEvents = events
    .filter((e) => isPast(e))
    .sort((a, b) => b.date.localeCompare(a.date))

  const currentUserAttendance = (eventId: string) =>
    attendances.find((a) => a.eventId === eventId && a.playerId === currentUserId)?.status ?? null

  const handleConfirm = (eventId: string, status: NonNullable<AttendanceStatus>, eventTitle: string) => {
    setAttendance(eventId, currentUserId, status)
    const labels: Record<NonNullable<AttendanceStatus>, string> = {
      asistire: 'Asistiré', no_asistire: 'No asistiré', tal_vez: 'Tal vez',
    }
    toast.success(`Confirmación actualizada: ${labels[status]}`, {
      description: eventTitle,
    })
  }

  return (
    <div className="space-y-4">
      {/* Header con acción */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {upcomingEvents.length} próximos · {pastEvents.length} finalizados
          </p>
        </div>
        <Button onClick={() => setShowNewEvent(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nuevo evento
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'proximos' | 'pasados')}>
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="proximos">Próximos</TabsTrigger>
          <TabsTrigger value="pasados">Finalizados</TabsTrigger>
        </TabsList>

        <TabsContent value="proximos" className="mt-4 space-y-3">
          {upcomingEvents.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No hay eventos programados.</p>
              </CardContent>
            </Card>
          )}
          {upcomingEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              attendances={attendances}
              players={players}
              userAttendance={currentUserAttendance(event.id)}
              onConfirm={(status) => handleConfirm(event.id, status, event.title)}
              expanded={expandedEventId === event.id}
              onToggleExpand={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
              onViewCallup={() => {
                setSelectedEventId(event.id)
                setActiveView('convocatorias')
              }}
            />
          ))}
        </TabsContent>

        <TabsContent value="pasados" className="mt-4 space-y-3">
          {pastEvents.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No hay eventos finalizados.</p>
              </CardContent>
            </Card>
          )}
          {pastEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              attendances={attendances}
              players={players}
              userAttendance={currentUserAttendance(event.id)}
              onConfirm={() => {}}
              expanded={expandedEventId === event.id}
              onToggleExpand={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
              onViewCallup={() => {
                setSelectedEventId(event.id)
                setActiveView('resultados')
              }}
              isPast
            />
          ))}
        </TabsContent>
      </Tabs>

      <NewEventDialog
        open={showNewEvent}
        onOpenChange={setShowNewEvent}
        onAdd={(data) => {
          addEvent(data)
          toast.success('Evento creado correctamente')
          setShowNewEvent(false)
        }}
      />
    </div>
  )
}

interface EventCardProps {
  event: TeamEvent
  attendances: ReturnType<typeof useAppStore.getState>['attendances']
  players: ReturnType<typeof useAppStore.getState>['players']
  userAttendance: AttendanceStatus
  onConfirm: (status: NonNullable<AttendanceStatus>) => void
  expanded: boolean
  onToggleExpand: () => void
  onViewCallup: () => void
  isPast?: boolean
}

function EventCard({
  event, attendances, players, userAttendance, onConfirm, expanded, onToggleExpand, onViewCallup, isPast,
}: EventCardProps) {
  const counts = countAttendances(attendances, event.id)
  const confirmedPlayers = attendances
    .filter((a) => a.eventId === event.id && a.status === 'asistire')
    .map((a) => players.find((p) => p.id === a.playerId))
    .filter(Boolean)

  const dUntil = daysUntil(event.date)
  const dayLabel = dUntil === 0 ? 'Hoy' : dUntil === 1 ? 'Mañana' : dUntil > 0 ? `En ${dUntil} días` : `Hace ${-dUntil} días`

  return (
    <Card className={cn('overflow-hidden transition-all', expanded && 'shadow-md')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Fecha */}
          <div className="flex flex-col items-center justify-center w-14 shrink-0 rounded-lg bg-muted py-2">
            <span className="text-[10px] font-medium uppercase text-muted-foreground">
              {new Date(event.date + 'T00:00:00').toLocaleDateString('es-CO', { month: 'short' })}
            </span>
            <span className="text-xl font-extrabold leading-none">
              {new Date(event.date + 'T00:00:00').getDate()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={cn('text-[10px]', eventTypeColor(event.type))}>
                {eventTypeLabel(event.type)}
              </Badge>
              <span className="text-xs text-muted-foreground">{dayLabel}</span>
              {event.opponent && (
                <Badge variant="outline" className="text-[10px]">
                  {event.isHome ? 'Local' : 'Visitante'}
                </Badge>
              )}
              {isPast && event.homeScore !== undefined && (
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {event.homeScore} - {event.awayScore}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm">{event.title}</h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {event.time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> <span className="truncate max-w-[160px]">{event.location}</span>
              </span>
            </div>
            {event.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{event.description}</p>
            )}
          </div>
        </div>

        {/* Confirmaciones */}
        {!isPast && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {counts.yes}
                </span>
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <HelpCircle className="h-3.5 w-3.5" /> {counts.maybe}
                </span>
                <span className="flex items-center gap-1 text-rose-600 font-medium">
                  <XCircle className="h-3.5 w-3.5" /> {counts.no}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onToggleExpand} className="h-7 text-xs">
                {expanded ? 'Ocultar' : 'Ver confirmados'}
                <ChevronRight className={cn('h-3 w-3 ml-0.5 transition-transform', expanded && 'rotate-90')} />
              </Button>
            </div>

            {/* Botones de confirmación */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={userAttendance === 'asistire' ? 'default' : 'outline'}
                className={cn(userAttendance === 'asistire' && 'bg-emerald-600 hover:bg-emerald-700')}
                onClick={() => onConfirm('asistire')}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Asistiré
              </Button>
              <Button
                size="sm"
                variant={userAttendance === 'tal_vez' ? 'default' : 'outline'}
                className={cn(userAttendance === 'tal_vez' && 'bg-amber-600 hover:bg-amber-700')}
                onClick={() => onConfirm('tal_vez')}
              >
                <HelpCircle className="h-3.5 w-3.5 mr-1" />
                Tal vez
              </Button>
              <Button
                size="sm"
                variant={userAttendance === 'no_asistire' ? 'default' : 'outline'}
                className={cn(userAttendance === 'no_asistire' && 'bg-rose-600 hover:bg-rose-700')}
                onClick={() => onConfirm('no_asistire')}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                No
              </Button>
            </div>

            {/* Lista expandida */}
            {expanded && (
              <div className="mt-3 pt-3 border-t animate-fade-in">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Confirmados ({confirmedPlayers.length})
                </p>
                {confirmedPlayers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {confirmedPlayers.map((p) => p && (
                      <div key={p.id} className="flex items-center gap-1.5 px-1.5 py-1 rounded-full bg-muted">
                        <PlayerAvatar player={p} size="sm" />
                        <span className="text-xs font-medium pr-2">{p.name.split(' ')[0]} #{p.jerseyNumber}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Aún no hay jugadores confirmados.</p>
                )}

                {event.type === 'partido' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={onViewCallup}
                  >
                    Ver convocatoria
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {isPast && event.type === 'partido' && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={onViewCallup}
          >
            Ver estadísticas del partido
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface NewEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (data: Omit<TeamEvent, 'id' | 'status'>) => void
}

function NewEventDialog({ open, onOpenChange, onAdd }: NewEventDialogProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TeamEvent['type']>('entrenamiento')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('18:30')
  const [location, setLocation] = useState('')
  const [opponent, setOpponent] = useState('')
  const [isHome, setIsHome] = useState(true)
  const [description, setDescription] = useState('')

  const handleSubmit = () => {
    if (!title || !date || !location) return
    onAdd({
      title, type, date, time, location,
      opponent: type === 'partido' ? opponent : undefined,
      isHome: type === 'partido' ? isHome : undefined,
      description: description || undefined,
    })
    setTitle(''); setDate(''); setLocation(''); setOpponent(''); setDescription('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear nuevo evento</DialogTitle>
          <DialogDescription>Programa un entrenamiento, partido u otro evento del equipo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Entrenamiento táctico" />
          </div>
          <div>
            <Label>Tipo de evento</Label>
            <Select value={type} onValueChange={(v) => setType(v as TeamEvent['type'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="entrenamiento">Entrenamiento</SelectItem>
                <SelectItem value="partido">Partido</SelectItem>
                <SelectItem value="torneo">Torneo</SelectItem>
                <SelectItem value="reunion">Reunión</SelectItem>
                <SelectItem value="evento">Evento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Hora</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Ubicación</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Cancha Municipal" />
          </div>
          {type === 'partido' && (
            <>
              <div>
                <Label>Contrincante</Label>
                <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Ej: Tigres del Norte" />
              </div>
              <div>
                <Label>Condición</Label>
                <Select value={isHome ? 'local' : 'visitante'} onValueChange={(v) => setIsHome(v === 'local')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="visitante">Visitante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div>
            <Label>Descripción (opcional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!title || !date || !location}>Crear evento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
