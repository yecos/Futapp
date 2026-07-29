'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, Trophy, Crown, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface Player {
  id: string
  fullName: string
  jerseyNumber: number
  primaryPosition: string
}

interface LoadResultDialogProps {
  open: boolean
  onClose: () => void
  eventId: string
  eventTitle: string
  isHome: boolean
  opponent: string | null
  players: Player[]
  onSaved?: () => void
}

interface PlayerStat {
  playerId: string
  goals: number
  assists: number
  minutesPlayed: number
  yellowCards: number
  redCards: number
  isMotm: boolean
}

export function LoadResultDialog({
  open, onClose, eventId, eventTitle, isHome, opponent, players, onSaved,
}: LoadResultDialogProps) {
  const [homeScore, setHomeScore] = useState<string>('')
  const [awayScore, setAwayScore] = useState<string>('')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState<Record<string, PlayerStat>>({})
  const [saving, setSaving] = useState(false)

  // Filtrar jugadores por búsqueda
  const filteredPlayers = players.filter(p =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    String(p.jerseyNumber).includes(search)
  )

  const updateStat = (playerId: string, field: keyof PlayerStat, value: any) => {
    setStats(prev => ({
      ...prev,
      [playerId]: {
        playerId,
        goals: 0,
        assists: 0,
        minutesPlayed: 0,
        yellowCards: 0,
        redCards: 0,
        isMotm: false,
        ...prev[playerId],
        [field]: value,
      },
    }))
  }

  const hasStat = (playerId: string) => {
    const s = stats[playerId]
    if (!s) return false
    return s.goals > 0 || s.assists > 0 || s.minutesPlayed > 0 ||
           s.yellowCards > 0 || s.redCards > 0 || s.isMotm
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (homeScore === '' || awayScore === '') {
      toast.error('Ingresa el marcador')
      return
    }

    const statsArray = Object.values(stats).filter(s =>
      s.goals > 0 || s.assists > 0 || s.minutesPlayed > 0 ||
      s.yellowCards > 0 || s.redCards > 0 || s.isMotm
    )

    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: parseInt(homeScore),
          awayScore: parseInt(awayScore),
          stats: statsArray,
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
        throw new Error(err.error || 'Error al cargar resultado')
      }

      toast.success('Resultado cargado correctamente')
      onClose()
      onSaved?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const ourLabel = isHome ? 'Nosotros (Local)' : `Nosotros (Visitante)`
  const theirLabel = isHome ? `${opponent || 'Visitante'} (Visitante)` : `${opponent || 'Local'} (Local)`

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            Cargar resultado
          </DialogTitle>
          <DialogDescription>{eventTitle}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Marcador */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{ourLabel}</Label>
              <Input
                type="number"
                min="0"
                max="99"
                value={homeScore}
                onChange={(e) => isHome ? setHomeScore(e.target.value) : setAwayScore(e.target.value)}
                className="text-center text-2xl font-bold"
                required
              />
            </div>
            <div>
              <Label>{theirLabel}</Label>
              <Input
                type="number"
                min="0"
                max="99"
                value={awayScore}
                onChange={(e) => isHome ? setAwayScore(e.target.value) : setHomeScore(e.target.value)}
                className="text-center text-2xl font-bold"
                required
              />
            </div>
          </div>

          {/* Stats por jugador */}
          <div>
            <Label className="text-sm">Estadísticas por jugador (opcional)</Label>
            <div className="relative mt-2 mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar jugador..."
                className="pl-9 h-9"
              />
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredPlayers.map((p) => {
                const s = stats[p.id]
                const has = hasStat(p.id)
                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      has ? 'border-primary/40 bg-primary/5' : 'border-white/5 bg-card/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded bg-primary/20 text-primary text-xs font-bold">
                        {p.jerseyNumber}
                      </span>
                      <span className="text-sm font-medium flex-1">{p.fullName}</span>
                      <button
                        type="button"
                        onClick={() => updateStat(p.id, 'isMotm', !s?.isMotm)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                          s?.isMotm ? 'bg-amber-500 text-amber-900' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                        }`}
                      >
                        <Crown className="h-3 w-3" /> MVP
                        </button>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      <div>
                        <Label className="text-[9px] text-muted-foreground">Goles</Label>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          value={s?.goals || ''}
                          onChange={(e) => updateStat(p.id, 'goals', parseInt(e.target.value) || 0)}
                          className="h-8 text-center text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] text-muted-foreground">Asist.</Label>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          value={s?.assists || ''}
                          onChange={(e) => updateStat(p.id, 'assists', parseInt(e.target.value) || 0)}
                          className="h-8 text-center text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] text-muted-foreground">Min</Label>
                        <Input
                          type="number"
                          min="0"
                          max="300"
                          value={s?.minutesPlayed || ''}
                          onChange={(e) => updateStat(p.id, 'minutesPlayed', parseInt(e.target.value) || 0)}
                          className="h-8 text-center text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] text-muted-foreground">🟨</Label>
                        <Input
                          type="number"
                          min="0"
                          max="2"
                          value={s?.yellowCards || ''}
                          onChange={(e) => updateStat(p.id, 'yellowCards', parseInt(e.target.value) || 0)}
                          className="h-8 text-center text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] text-muted-foreground">🟥</Label>
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          value={s?.redCards || ''}
                          onChange={(e) => updateStat(p.id, 'redCards', parseInt(e.target.value) || 0)}
                          className="h-8 text-center text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando…</>
              ) : (
                <><Trophy className="h-4 w-4 mr-2" />Guardar resultado</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
