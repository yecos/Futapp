'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft, MapPin, Users, Trophy, Clock, Search, Send, Loader2, Shield, Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const POSITION_LABELS: Record<string, string> = {
  PORTERO: 'Portero',
  DEFENSA: 'Defensa',
  MEDIOCAMPISTA: 'Mediocampista',
  DELANTERO: 'Delantero',
}

const POSITION_COLORS: Record<string, string> = {
  PORTERO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DEFENSA: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  MEDIOCAMPISTA: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  DELANTERO: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
}

interface Opening {
  id: string
  title: string
  description: string | null
  position: string
  city: string | null
  zone: string | null
  compensation: string | null
  isHighlighted: boolean
  expiresAt: string
  createdAt: string
  team: {
    id: string
    name: string
    shortName: string
    primaryColor: string
    category: string
  }
  _count: { applications: number }
}

interface MarketplaceClientProps {
  openings: Opening[]
  freePlayer: { id: string; fullName: string; primaryPosition: string; city: string | null }
}

export function MarketplaceClient({ openings: initial, freePlayer }: MarketplaceClientProps) {
  const router = useRouter()
  const [openings, setOpenings] = useState(initial)
  const [search, setSearch] = useState('')
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const [applyTo, setApplyTo] = useState<Opening | null>(null)
  const [message, setMessage] = useState('')
  const [applying, setApplying] = useState(false)

  const filtered = openings.filter(o => {
    const matchesSearch = !search ||
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.team.name.toLowerCase().includes(search.toLowerCase())
    const matchesPosition = positionFilter === 'all' || o.position === positionFilter
    return matchesSearch && matchesPosition
  })

  const handleApply = async () => {
    if (!applyTo) return
    setApplying(true)
    try {
      const res = await fetch(`/api/openings/${applyTo.id}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message || undefined }),
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        toast.error('Tu sesión expiró.')
        setTimeout(() => { window.location.href = '/login' }, 1500)
        return
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al postular')
      }

      toast.success('¡Postulación enviada!')
      setApplyTo(null)
      setMessage('')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <Link href="/mi-carta" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Mi carta
          </Link>
          <h1 className="text-xl font-bold mt-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Marketplace
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Equipos buscando jugadores como tú
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-24">
        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por equipo o título..."
              className="pl-9"
            />
          </div>
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="PORTERO">Porteros</SelectItem>
              <SelectItem value="DEFENSA">Defensas</SelectItem>
              <SelectItem value="MEDIOCAMPISTA">Mediocamp.</SelectItem>
              <SelectItem value="DELANTERO">Delanteros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de cupos */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No hay cupos abiertos{positionFilter !== 'all' ? ' para tu posición' : ''} en este momento.</p>
              <p className="text-xs mt-2">Vuelve pronto, los equipos publican nuevos cupos cada semana.</p>
            </CardContent></Card>
          ) : (
            filtered.map((opening, i) => (
              <Card
                key={opening.id}
                className={`border-white/5 bg-gradient-card animate-fade-in-up ${
                  opening.isHighlighted ? 'ring-2 ring-amber-500/40' : ''
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Escudo del equipo */}
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-xs shrink-0"
                      style={{ backgroundColor: opening.team.primaryColor }}
                    >
                      {opening.team.shortName.slice(0, 3)}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${POSITION_COLORS[opening.position]}`}>
                          {POSITION_LABELS[opening.position]}
                        </Badge>
                        {opening.isHighlighted && (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                            ⭐ Destacado
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-bold text-sm">{opening.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {opening.team.name} · {opening.team.category}
                      </p>

                      {/* Detalles */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        {opening.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {opening.city}
                            {opening.zone && `, ${opening.zone}`}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {opening._count.applications} postulaciones
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Expira {new Date(opening.expiresAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      {opening.compensation && (
                        <p className="text-xs text-emerald-400 mt-1">
                          💰 {opening.compensation}
                        </p>
                      )}

                      {opening.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {opening.description}
                        </p>
                      )}

                      {/* Acción */}
                      <Button
                        size="sm"
                        className="mt-3 bg-gradient-primary"
                        onClick={() => setApplyTo(opening)}
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Postular
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Link a mis postulaciones */}
        <div className="mt-6 text-center">
          <Link href="/mis-postulaciones" className="text-sm text-primary hover:underline">
            Ver mis postulaciones →
          </Link>
        </div>
      </main>

      {/* Dialog de postulación */}
      {applyTo && (
        <Dialog open onOpenChange={() => setApplyTo(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Postular a: {applyTo.title}</DialogTitle>
              <DialogDescription>
                {applyTo.team.name} · {POSITION_LABELS[applyTo.position]}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-card/50 border border-white/5 text-sm">
                <p className="text-muted-foreground text-xs mb-1">Tu carta se compartirá automáticamente:</p>
                <p className="font-medium">{freePlayer.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {POSITION_LABELS[freePlayer.primaryPosition]}
                  {freePlayer.city && ` · ${freePlayer.city}`}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Mensaje al equipo (opcional)</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Cuéntales por qué eres el jugador ideal..."
                  rows={4}
                  maxLength={1000}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setApplyTo(null)}>Cancelar</Button>
              <Button onClick={handleApply} disabled={applying}>
                {applying ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando…</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Enviar postulación</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
