'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft, Plus, Users, Clock, Trash2, Check, X, Loader2, MapPin, Activity, Crown,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const POSITION_LABELS: Record<string, string> = {
  PORTERO: 'Portero', DEFENSA: 'Defensa', MEDIOCAMPISTA: 'Mediocampista', DELANTERO: 'Delantero',
}

const POSITION_COLORS: Record<string, string> = {
  PORTERO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DEFENSA: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  MEDIOCAMPISTA: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  DELANTERO: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
}

interface Application {
  id: string
  status: string
  message: string | null
  teamResponse: string | null
  freePlayer: {
    id: string
    fullName: string
    age: number
    photoUrl: string | null
    primaryPosition: string
    city: string | null
    bestVerticalJumpCm: number | null
    bestSprint10Sec: number | null
  }
}

interface Opening {
  id: string
  title: string
  description: string | null
  position: string
  city: string | null
  zone: string | null
  compensation: string | null
  status: string
  isHighlighted: boolean
  expiresAt: string
  createdAt: string
  _count: { applications: number }
  applications: Application[]
}

interface AdminOpeningsClientProps {
  openings: Opening[]
  teamName: string
  isPremium: boolean
}

export function AdminOpeningsClient({ openings: initial, teamName, isPremium }: AdminOpeningsClientProps) {
  const router = useRouter()
  const [openings, setOpenings] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [responding, setResponding] = useState<{ appId: string; action: 'accept' | 'reject' } | null>(null)
  const [teamResponse, setTeamResponse] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const openCount = openings.filter(o => o.status === 'ABIERTA').length
  const limit = isPremium ? 20 : 3

  const handleCreate = async (data: any) => {
    try {
      const res = await fetch('/api/openings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear cupo')
      }
      toast.success('Cupo publicado')
      setShowCreate(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleClose = async (id: string) => {
    if (!confirm('¿Cerrar este cupo? No recibirá más postulaciones.')) return
    try {
      await fetch(`/api/openings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CERRADA' }),
      })
      toast.success('Cupo cerrado')
      router.refresh()
    } catch {
      toast.error('Error al cerrar')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cupo y todas sus postulaciones?')) return
    try {
      await fetch(`/api/openings/${id}`, { method: 'DELETE' })
      toast.success('Cupo eliminado')
      router.refresh()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleRespond = async () => {
    if (!responding) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/applications/${responding.appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: responding.action,
          teamResponse: teamResponse || undefined,
        }),
      })
      if (!res.ok) throw new Error('Error')
      toast.success(responding.action === 'accept' ? 'Postulación aceptada' : 'Postulación rechazada')
      setResponding(null)
      setTeamResponse('')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-xl font-bold">Cupos Abiertos</h1>
              <p className="text-xs text-muted-foreground">
                {openCount}/{limit} cupos usados
                {!isPremium && openCount >= limit - 1 && (
                  <span className="text-amber-400 ml-1">· Upgrade premium para más</span>
                )}
              </p>
            </div>
            {openCount < limit && (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" /> Publicar cupo
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-24 space-y-4">
        {openings.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No tienes cupos publicados.</p>
            <p className="text-xs mt-2">Publica un cupo para que jugadores libres puedan postular.</p>
            {openCount < limit && (
              <Button size="sm" className="mt-3" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" /> Publicar cupo
              </Button>
            )}
          </CardContent></Card>
        ) : (
          openings.map((opening) => (
            <Card key={opening.id} className="border-white/5 bg-gradient-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${POSITION_COLORS[opening.position]}`}>
                        {POSITION_LABELS[opening.position]}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${
                        opening.status === 'ABIERTA' ? 'bg-emerald-500/20 text-emerald-400' :
                        opening.status === 'CUBIERTA' ? 'bg-sky-500/20 text-sky-400' :
                        'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {opening.status}
                      </Badge>
                      {opening.isHighlighted && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-400">
                          ⭐ Destacado
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-sm">{opening.title}</h3>
                    {opening.description && (
                      <p className="text-xs text-muted-foreground mt-1">{opening.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      {opening.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{opening.city}</span>}
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{opening._count.applications} postulaciones</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Expira {new Date(opening.expiresAt).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {opening.status === 'ABIERTA' && (
                      <button
                        onClick={() => handleClose(opening.id)}
                        className="p-1.5 rounded text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        title="Cerrar cupo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(opening.id)}
                      className="p-1.5 rounded text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Postulaciones */}
                {opening.applications.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <h4 className="text-xs font-bold mb-2">Postulaciones ({opening.applications.length})</h4>
                    <div className="space-y-2">
                      {opening.applications.map((app) => (
                        <div key={app.id} className={`p-2 rounded-lg border ${
                          app.status === 'ACEPTADA' ? 'border-emerald-500/30 bg-emerald-500/5' :
                          app.status === 'RECHAZADA' ? 'border-rose-500/20 bg-rose-500/5' :
                          'border-white/5 bg-card/30'
                        }`}>
                          <div className="flex items-start gap-2">
                            {/* Avatar */}
                            <div className="shrink-0">
                              {app.freePlayer.photoUrl ? (
                                <img src={app.freePlayer.photoUrl} alt={app.freePlayer.fullName} className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-primary/20 text-primary">
                                  {app.freePlayer.fullName[0]}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link href={`/carta/${app.freePlayer.id}`} target="_blank" className="text-sm font-medium hover:underline">
                                  {app.freePlayer.fullName}
                                </Link>
                                <span className="text-[10px] text-muted-foreground">{app.freePlayer.age} años</span>
                                <Badge variant="outline" className={`text-[9px] ${POSITION_COLORS[app.freePlayer.primaryPosition]}`}>
                                  {POSITION_LABELS[app.freePlayer.primaryPosition]}
                                </Badge>
                                {app.status !== 'PENDIENTE' && (
                                  <Badge variant="outline" className={`text-[9px] ${
                                    app.status === 'ACEPTADA' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                  }`}>
                                    {app.status}
                                  </Badge>
                                )}
                              </div>

                              {/* Stats rápidas */}
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                                {app.freePlayer.bestVerticalJumpCm && (
                                  <span className="flex items-center gap-0.5">
                                    <Activity className="h-2.5 w-2.5" /> {app.freePlayer.bestVerticalJumpCm}cm salto
                                  </span>
                                )}
                                {app.freePlayer.bestSprint10Sec && (
                                  <span>⚡ {app.freePlayer.bestSprint10Sec.toFixed(2)}s sprint</span>
                                )}
                              </div>

                              {app.message && (
                                <p className="text-xs text-muted-foreground mt-1 italic">"{app.message}"</p>
                              )}

                              {app.teamResponse && (
                                <p className="text-xs mt-1 p-1 rounded bg-card/50">
                                  <strong>Tú:</strong> {app.teamResponse}
                                </p>
                              )}

                              {/* Acciones */}
                              {app.status === 'PENDIENTE' && (
                                <div className="flex gap-1 mt-2">
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => { setResponding({ appId: app.id, action: 'accept' }); setTeamResponse('') }}
                                  >
                                    <Check className="h-3 w-3 mr-0.5" /> Aceptar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-rose-400 border-rose-500/30"
                                    onClick={() => { setResponding({ appId: app.id, action: 'reject' }); setTeamResponse('') }}
                                  >
                                    <X className="h-3 w-3 mr-0.5" /> Rechazar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* Dialog crear cupo */}
      {showCreate && (
        <CreateOpeningDialog
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Dialog responder */}
      {responding && (
        <Dialog open onOpenChange={() => setResponding(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {responding.action === 'accept' ? 'Aceptar postulación' : 'Rechazar postulación'}
              </DialogTitle>
              <DialogDescription>
                {responding.action === 'accept'
                  ? 'Al aceptar, tu equipo podrá ver la carta completa del jugador.'
                  : 'El jugador recibirá tu respuesta.'}
              </DialogDescription>
            </DialogHeader>
            <div>
              <Label>Respuesta (opcional)</Label>
              <Textarea
                value={teamResponse}
                onChange={(e) => setTeamResponse(e.target.value)}
                placeholder={responding.action === 'accept' ? 'Bienvenido al equipo. Contacto: ...' : 'Motivo del rechazo...'}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResponding(null)}>Cancelar</Button>
              <Button
                onClick={handleRespond}
                disabled={actionLoading}
                className={responding.action === 'accept' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {responding.action === 'accept' ? 'Aceptar' : 'Rechazar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function CreateOpeningDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    position: 'MEDIOCAMPISTA' as 'PORTERO' | 'DEFENSA' | 'MEDIOCAMPISTA' | 'DELANTERO',
    city: '',
    zone: '',
    compensation: '',
    expiresInDays: 30,
  })
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) {
      toast.error('Título requerido')
      return
    }
    setCreating(true)
    await onCreate({
      title: form.title,
      description: form.description || undefined,
      position: form.position,
      city: form.city || undefined,
      zone: form.zone || undefined,
      compensation: form.compensation || undefined,
      expiresInDays: form.expiresInDays,
    })
    setCreating(false)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Publicar cupo</DialogTitle>
          <DialogDescription>Jugadores libres podrán verlo y postular</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Buscamos delantero para torneo"
              required
            />
          </div>

          <div>
            <Label>Posición requerida *</Label>
            <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PORTERO">Portero</SelectItem>
                <SelectItem value="DEFENSA">Defensa</SelectItem>
                <SelectItem value="MEDIOCAMPISTA">Mediocampista</SelectItem>
                <SelectItem value="DELANTERO">Delantero</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalles del cupo, horarios, categoría..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ciudad</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Medellín" />
            </div>
            <div>
              <Label>Zona</Label>
              <Input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="Laureles" />
            </div>
          </div>

          <div>
            <Label>Compensación (opcional)</Label>
            <Input
              value={form.compensation}
              onChange={(e) => setForm({ ...form, compensation: e.target.value })}
              placeholder="Ej: Pago por partido, transporte, etc."
            />
          </div>

          <div>
            <Label>Vence en</Label>
            <Select value={String(form.expiresInDays)} onValueChange={(v) => setForm({ ...form, expiresInDays: parseInt(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 días</SelectItem>
                <SelectItem value="15">15 días</SelectItem>
                <SelectItem value="30">30 días</SelectItem>
                <SelectItem value="60">60 días</SelectItem>
                <SelectItem value="90">90 días</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Publicar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
