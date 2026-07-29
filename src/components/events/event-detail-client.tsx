'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft, Clock, MapPin, Calendar, CheckCircle2, XCircle, HelpCircle,
  Trophy, Users, ClipboardList, Shield, Loader2, Plus,
} from 'lucide-react'
import { EventChat } from '@/components/events/event-chat'

interface EventDetailClientProps {
  event: any
  myRole: string
  myPlayerId: string | null
}

const TYPE_LABELS: Record<string, string> = {
  ENTRENAMIENTO: 'Entrenamiento',
  PARTIDO: 'Partido',
  TORNEO: 'Torneo',
  REUNION: 'Reunión',
  EVENTO: 'Evento',
}

const TYPE_COLORS: Record<string, string> = {
  ENTRENAMIENTO: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  PARTIDO: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  TORNEO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  REUNION: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  EVENTO: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
}

const STATUS_INFO: Record<string, { label: string; icon: any; color: string }> = {
  ASISTIRE: { label: 'Asistiré', icon: CheckCircle2, color: 'bg-emerald-500/20 text-emerald-400' },
  NO_ASISTIRE: { label: 'No asistiré', icon: XCircle, color: 'bg-rose-500/20 text-rose-400' },
  TAL_VEZ: { label: 'Tal vez', icon: HelpCircle, color: 'bg-amber-500/20 text-amber-400' },
}

export function EventDetailClient({ event, myRole, myPlayerId }: EventDetailClientProps) {
  const router = useRouter()
  const [savingStatus, setSavingStatus] = useState<string | null>(null)

  // Mi asistencia actual
  const myAttendance = event.attendances.find((a: any) => a.playerId === myPlayerId)
  const [myStatus, setMyStatus] = useState<string | null>(myAttendance?.status || null)

  const setAttendance = async (status: 'ASISTIRE' | 'NO_ASISTIRE' | 'TAL_VEZ' | null) => {
    setSavingStatus(status || 'clear')
    try {
      const res = await fetch(`/api/events/${event.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        toast.error('Tu sesión expiró.')
        setTimeout(() => { window.location.href = '/login' }, 1500)
        return
      }
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error')
      }
      setMyStatus(status)
      toast.success(status ? `Asistencia: ${STATUS_INFO[status].label}` : 'Asistencia removida')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingStatus(null)
    }
  }

  // Conteos
  const counts = {
    ASISTIRE: event.attendances.filter((a: any) => a.status === 'ASISTIRE').length,
    NO_ASISTIRE: event.attendances.filter((a: any) => a.status === 'NO_ASISTIRE').length,
    TAL_VEZ: event.attendances.filter((a: any) => a.status === 'TAL_VEZ').length,
    SIN_RESPONDER: event.attendances.filter((a: any) => !a.status).length,
  }

  const canManage = ['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(myRole)
  const canEdit = ['ADMIN', 'ENTRENADOR'].includes(myRole)
  const isPast = event.status === 'COMPLETADO' || new Date(event.date) < new Date()
  const isMatch = event.type === 'PARTIDO'

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <Link href="/calendario" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Calendario
          </Link>
          <h1 className="text-xl font-bold mt-2">{event.title}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-24 space-y-4">
        {/* Info principal */}
        <Card className="border-white/5 bg-gradient-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="outline" className={`text-[10px] ${TYPE_COLORS[event.type]}`}>
                {TYPE_LABELS[event.type] || event.type}
              </Badge>
              {event.opponent && (
                <Badge variant="outline" className="text-[10px]">
                  {event.isHome ? '🏠 Local' : '✈️ Visitante'} vs {event.opponent}
                </Badge>
              )}
              <Badge variant="secondary" className="text-[10px]">
                {event.status === 'PROGRAMADO' ? 'Programado' : event.status === 'COMPLETADO' ? 'Completado' : 'Cancelado'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{new Date(event.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>{new Date(event.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{event.location}</span>
              </div>
            </div>

            {event.description && (
              <p className="text-sm text-muted-foreground mt-3 p-3 rounded-lg bg-card/50 border border-white/5">
                {event.description}
              </p>
            )}

            {isPast && event.homeScore !== null && (
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-primary/20 to-emerald-600/20 text-center">
                <p className="text-3xl font-black">{event.homeScore} - {event.awayScore}</p>
                <p className="text-xs text-muted-foreground mt-1">Resultado final</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mi asistencia - solo si no es pasado y tengo player */}
        {!isPast && myPlayerId && (
          <Card className="border-primary/30 bg-gradient-card">
            <CardContent className="p-5">
              <h3 className="font-bold text-sm mb-3">Mi asistencia</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['ASISTIRE', 'TAL_VEZ', 'NO_ASISTIRE'] as const).map((s) => {
                  const info = STATUS_INFO[s]
                  const Icon = info.icon
                  const isActive = myStatus === s
                  return (
                    <button
                      key={s}
                      onClick={() => setAttendance(isActive ? null : s)}
                      disabled={savingStatus !== null}
                      className={`flex flex-col items-center gap-1 py-3 rounded-lg border-2 transition-all disabled:opacity-50 ${
                        isActive ? 'border-primary bg-primary/10' : 'border-white/5 bg-card/50 hover:border-primary/30'
                      }`}
                    >
                      {savingStatus === s ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      )}
                      <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        {info.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumen de asistencia */}
        {!isPast && (
          <Card className="border-white/5 bg-gradient-card">
            <CardContent className="p-5">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Resumen de asistencia
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <p className="text-2xl font-black text-emerald-400">{counts.ASISTIRE}</p>
                  <p className="text-[10px] text-muted-foreground">Asistirán</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <p className="text-2xl font-black text-amber-400">{counts.TAL_VEZ}</p>
                  <p className="text-[10px] text-muted-foreground">Tal vez</p>
                </div>
                <div className="p-2 rounded-lg bg-rose-500/10">
                  <p className="text-2xl font-black text-rose-400">{counts.NO_ASISTIRE}</p>
                  <p className="text-[10px] text-muted-foreground">No asistirán</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/20">
                  <p className="text-2xl font-black text-muted-foreground">{counts.SIN_RESPONDER}</p>
                  <p className="text-[10px] text-muted-foreground">Sin responder</p>
                </div>
              </div>

              {canManage && event.attendances.length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    Ver lista detallada de jugadores
                  </summary>
                  <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                    {event.attendances.map((a: any) => {
                      const info = a.status ? STATUS_INFO[a.status] : null
                      return (
                        <div key={a.playerId} className="flex items-center gap-2 p-2 rounded bg-card/30 text-xs">
                          <span className="font-bold w-8 text-center">#{a.player.jerseyNumber}</span>
                          <span className="flex-1">{a.player.fullName}</span>
                          {info ? (
                            <Badge variant="outline" className={`text-[9px] ${info.color}`}>
                              <info.icon className="h-2.5 w-2.5 mr-0.5" /> {info.label}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] text-muted-foreground">
                              Sin responder
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        )}

        {/* Chat del evento */}
        <EventChat eventId={event.id} />

        {/* Acciones de management */}
        {canManage && (
          <Card className="border-white/5 bg-gradient-card">
            <CardContent className="p-5">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Acciones de staff
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push(`/convocatorias?event=${event.id}`)}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Convocatoria
                </Button>
                {isMatch && isPast && event.homeScore === null && (
                  <Button size="sm" onClick={() => router.push(`/resultados?event=${event.id}`)}>
                    <Trophy className="h-4 w-4 mr-2" />
                    Cargar resultado
                  </Button>
                )}
                {canEdit && (
                  <Button variant="outline" size="sm" className="col-span-2 text-rose-400" onClick={async () => {
                    if (!confirm('¿Eliminar este evento? Esta acción no se puede deshacer.')) return
                    const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' })
                    if (res.ok) {
                      toast.success('Evento eliminado')
                      router.push('/calendario')
                    } else {
                      toast.error('Error al eliminar')
                    }
                  }}>
                    Eliminar evento
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
