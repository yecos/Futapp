'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ClipboardList, Save, Loader2, Crown, Check, X } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface MatchData {
  id: string
  title: string
  date: string
  opponent: string | null
  isHome: boolean | null
  status: string
  homeScore: number | null
  awayScore: number | null
  formation: string | null
}

interface PlayerData {
  id: string
  fullName: string
  jerseyNumber: number
  primaryPosition: string
  status: string
}

interface ExistingCallup {
  id: string
  playerId: string
  status: string
  positionLabel: string | null
  isCaptain: boolean
  order: number | null
}

const POS_SHORT: Record<string, string> = {
  PORTERO: 'POR',
  DEFENSA: 'DEF',
  MEDIOCAMPISTA: 'MED',
  DELANTERO: 'DEL',
}

const POS_COLORS: Record<string, string> = {
  PORTERO: 'bg-amber-500',
  DEFENSA: 'bg-sky-500',
  MEDIOCAMPISTA: 'bg-emerald-500',
  DELANTERO: 'bg-rose-500',
}

type CallupStatus = 'TITULAR' | 'SUPLENTE' | 'NO_CONVOCADO'

export function CallupsView({ matches, players }: { matches: MatchData[]; players: PlayerData[] }) {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const now = new Date()
  const upcomingMatches = matches.filter(m => new Date(m.date) >= now && m.status === 'PROGRAMADO')

  const initialEventId = searchParams.get('event') || upcomingMatches[0]?.id || ''
  const [selectedMatchId, setSelectedMatchId] = useState<string>(initialEventId)
  const [callups, setCallups] = useState<Record<string, { status: CallupStatus; isCaptain: boolean; positionLabel: string }>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const selectedMatch = upcomingMatches.find(m => m.id === selectedMatchId)

  const canManage = ['ADMIN', 'ENTRENADOR'].includes(session?.user?.role || '')

  // Cargar convocatoria existente al cambiar de partido
  useEffect(() => {
    if (!selectedMatchId) return
    setLoading(true)
    fetch(`/api/callups?eventId=${selectedMatchId}`)
      .then(res => res.ok ? res.json() : [])
      .then((data: ExistingCallup[]) => {
        const map: Record<string, { status: CallupStatus; isCaptain: boolean; positionLabel: string }> = {}
        data.forEach(c => {
          map[c.playerId] = {
            status: c.status as CallupStatus,
            isCaptain: c.isCaptain,
            positionLabel: c.positionLabel || '',
          }
        })
        setCallups(map)
      })
      .catch(() => setCallups({}))
      .finally(() => setLoading(false))
  }, [selectedMatchId])

  const titulares = useMemo(() =>
    players.filter(p => callups[p.id]?.status === 'TITULAR')
      .sort((a, b) => (callups[a.id]?.positionLabel || '').localeCompare(callups[b.id]?.positionLabel || '')),
    [players, callups]
  )

  const suplentes = useMemo(() =>
    players.filter(p => callups[p.id]?.status === 'SUPLENTE'),
    [players, callups]
  )

  const noConvocados = useMemo(() =>
    players.filter(p => !callups[p.id] || callups[p.id]?.status === 'NO_CONVOCADO'),
    [players, callups]
  )

  const setStatus = (playerId: string, status: CallupStatus) => {
    setCallups(prev => ({
      ...prev,
      [playerId]: {
        status,
        isCaptain: prev[playerId]?.isCaptain || false,
        positionLabel: prev[playerId]?.positionLabel || '',
      },
    }))
  }

  const toggleCaptain = (playerId: string) => {
    setCallups(prev => {
      const current = prev[playerId]
      if (!current || current.status !== 'TITULAR') return prev
      // Solo un capitán a la vez
      const newCallups: typeof prev = {}
      Object.entries(prev).forEach(([id, c]) => {
        newCallups[id] = { ...c, isCaptain: id === playerId ? !c.isCaptain : false }
      })
      return newCallups
    })
  }

  const handleSave = async () => {
    if (!selectedMatchId) return
    setSaving(true)
    try {
      const callupsArray = Object.entries(callups).map(([playerId, c]) => ({
        playerId,
        status: c.status,
        isCaptain: c.isCaptain,
        positionLabel: c.positionLabel || undefined,
      }))

      const res = await fetch('/api/callups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedMatchId,
          callups: callupsArray,
        }),
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        toast.error('Tu sesión expiró.')
        setTimeout(() => { window.location.href = '/login' }, 1500)
        return
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }

      toast.success(`Convocatoria guardada (${callupsArray.filter(c => c.status === 'TITULAR').length} titulares)`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (upcomingMatches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-deportivo">
        <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
          <div className="mx-auto max-w-4xl px-4 py-3">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver
            </Link>
            <h1 className="text-xl font-bold mt-2">Convocatorias</h1>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No hay partidos próximos para convocar.</p>
          </CardContent></Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-xl font-bold">Convocatorias</h1>
            {canManage && (
              <Button size="sm" onClick={handleSave} disabled={saving || loading}>
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando…</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Guardar</>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-24">
        {/* Selector de partido */}
        <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
          {upcomingMatches.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMatchId(m.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedMatchId === m.id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
              }`}
            >
              vs {m.opponent || m.title}
            </button>
          ))}
        </div>

        {selectedMatch && (
          <>
            {/* Cancha visual con titulares */}
            <Card className="border-primary/20 bg-gradient-card overflow-hidden mb-4">
              <CardContent className="p-0">
                <div className="relative aspect-[3/4] max-w-sm mx-auto bg-gradient-to-b from-emerald-600 to-emerald-800">
                  <div className="absolute inset-2 border-2 border-white/30 rounded-lg" />
                  <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-white/30" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 border-2 border-white/30 rounded-full" />
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1/2 h-16 border-2 border-t-0 border-white/30" />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-16 border-2 border-b-0 border-white/30" />

                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/40 text-white text-[10px] font-bold">
                    {titulares.length} titulares
                  </div>

                  {/* Render titulares en posiciones */}
                  <div className="absolute inset-0 flex flex-col justify-around p-4 pt-12 pb-16">
                    {titulares.length === 0 && (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-white/80 text-xs text-center">
                          Selecciona jugadores como titulares
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap justify-center gap-2">
                      {titulares.map(p => {
                        const c = callups[p.id]
                        return (
                          <button
                            key={p.id}
                            onClick={() => canManage && toggleCaptain(p.id)}
                            className={`flex flex-col items-center gap-1 ${c?.isCaptain ? 'ring-2 ring-amber-400 rounded-lg p-1' : 'p-1'}`}
                          >
                            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${POS_COLORS[p.primaryPosition]} text-white font-bold text-xs relative`}>
                              {p.jerseyNumber}
                              {c?.isCaptain && (
                                <Crown className="absolute -top-1 -right-1 h-3 w-3 text-amber-400 fill-amber-400" />
                              )}
                            </div>
                            <span className="text-[8px] text-white font-medium max-w-[40px] truncate">
                              {p.fullName.split(' ')[0]}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 text-center text-white text-xs">
                    <p className="font-bold">{selectedMatch.title}</p>
                    <p className="text-white/80">{new Date(selectedMatch.date).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suplentes */}
            {suplentes.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-400">SUPLENTES ({suplentes.length})</Badge>
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {suplentes.map(p => (
                    <PlayerCard
                      key={p.id}
                      player={p}
                      callup={callups[p.id]}
                      canManage={canManage}
                      onSetStatus={setStatus}
                      onToggleCaptain={toggleCaptain}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Lista de jugadores disponibles para convocar */}
            <div>
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Plantilla ({noConvocados.length} sin convocar)
              </h3>
              {loading ? (
                <div className="text-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {noConvocados.map(p => (
                    <PlayerCard
                      key={p.id}
                      player={p}
                      callup={callups[p.id]}
                      canManage={canManage}
                      onSetStatus={setStatus}
                      onToggleCaptain={toggleCaptain}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function PlayerCard({
  player, callup, canManage, onSetStatus, onToggleCaptain,
}: {
  player: PlayerData
  callup?: { status: CallupStatus; isCaptain: boolean; positionLabel: string }
  canManage: boolean
  onSetStatus: (playerId: string, status: CallupStatus) => void
  onToggleCaptain: (playerId: string) => void
}) {
  const status = callup?.status
  return (
    <Card className={`border-white/5 bg-card/50 animate-fade-in-up ${
      status === 'TITULAR' ? 'border-emerald-500/40 bg-emerald-950/20' :
      status === 'SUPLENTE' ? 'border-amber-500/40 bg-amber-950/10' :
      'border-white/5'
    }`}>
      <CardContent className="p-2">
        <div className="flex items-center gap-2 mb-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${POS_COLORS[player.primaryPosition]} text-white font-bold text-xs relative`}>
            {player.jerseyNumber}
            {callup?.isCaptain && (
              <Crown className="absolute -top-1 -right-1 h-3 w-3 text-amber-400 fill-amber-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{player.fullName}</p>
            <p className="text-[10px] text-muted-foreground">{POS_SHORT[player.primaryPosition]}</p>
          </div>
        </div>
        {canManage && (
          <div className="flex gap-1">
            <button
              onClick={() => onSetStatus(player.id, 'TITULAR')}
              className={`flex-1 py-1 rounded text-[10px] font-medium transition-colors ${
                status === 'TITULAR' ? 'bg-emerald-500 text-emerald-950' : 'bg-muted/50 text-muted-foreground hover:bg-emerald-500/20'
              }`}
            >
              <Check className="h-3 w-3 inline" /> Titular
            </button>
            <button
              onClick={() => onSetStatus(player.id, 'SUPLENTE')}
              className={`flex-1 py-1 rounded text-[10px] font-medium transition-colors ${
                status === 'SUPLENTE' ? 'bg-amber-500 text-amber-950' : 'bg-muted/50 text-muted-foreground hover:bg-amber-500/20'
              }`}
            >
              Suplente
            </button>
            {status && (
              <button
                onClick={() => onSetStatus(player.id, 'NO_CONVOCADO')}
                className="py-1 px-2 rounded text-[10px] text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                title="Quitar"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
        {status === 'TITULAR' && canManage && (
          <button
            onClick={() => onToggleCaptain(player.id)}
            className={`w-full mt-1 py-1 rounded text-[10px] font-medium transition-colors ${
              callup?.isCaptain ? 'bg-amber-500 text-amber-950' : 'text-muted-foreground hover:bg-amber-500/20'
            }`}
          >
            <Crown className="h-3 w-3 inline mr-1" />
            {callup?.isCaptain ? 'Capitán' : 'Hacer capitán'}
          </button>
        )}
      </CardContent>
    </Card>
  )
}
