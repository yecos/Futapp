'use client'

import { useState } from 'react'
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
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface CreateEventDialogProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export function CreateEventDialog({ open, onClose, onCreated }: CreateEventDialogProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    type: 'ENTRENAMIENTO' as 'ENTRENAMIENTO' | 'PARTIDO' | 'TORNEO' | 'REUNION' | 'EVENTO',
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    opponent: '',
    isHome: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.date || !form.time || !form.location) {
      toast.error('Completa los campos obligatorios')
      return
    }

    const dateTime = new Date(`${form.date}T${form.time}`)

    setSaving(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          description: form.description || undefined,
          date: dateTime.toISOString(),
          location: form.location,
          opponent: form.opponent || undefined,
          isHome: form.type === 'PARTIDO' ? form.isHome : undefined,
        }),
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        toast.error('Tu sesión expiró. Serás redirigido al login.')
        setTimeout(() => { window.location.href = '/login' }, 1500)
        return
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear evento')
      }

      toast.success('Evento creado')
      setForm({
        type: 'ENTRENAMIENTO',
        title: '', description: '', date: '', time: '',
        location: '', opponent: '', isHome: true,
      })
      onClose()
      onCreated?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear evento</DialogTitle>
          <DialogDescription>Agrega un nuevo evento al calendario del equipo</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Tipo *</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTRENAMIENTO">Entrenamiento</SelectItem>
                <SelectItem value="PARTIDO">Partido</SelectItem>
                <SelectItem value="TORNEO">Torneo</SelectItem>
                <SelectItem value="REUNION">Reunión</SelectItem>
                <SelectItem value="EVENTO">Evento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={form.type === 'PARTIDO' ? 'vs Real Madrid' : 'Entreno táctico'}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                min={today}
                required
              />
            </div>
            <div>
              <Label>Hora *</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Ubicación *</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Cancha La Bombonera"
              required
            />
          </div>

          {form.type === 'PARTIDO' && (
            <>
              <div>
                <Label>Equipo rival</Label>
                <Input
                  value={form.opponent}
                  onChange={(e) => setForm({ ...form, opponent: e.target.value })}
                  placeholder="Real Madrid FC"
                />
              </div>
              <div>
                <Label>Condición</Label>
                <Select
                  value={form.isHome ? 'LOCAL' : 'VISITANTE'}
                  onValueChange={(v) => setForm({ ...form, isHome: v === 'LOCAL' })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOCAL">Local</SelectItem>
                    <SelectItem value="VISITANTE">Visitante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div>
            <Label>Descripción (opcional)</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Traer equipamiento especial, llegada 30 min antes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando…</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" />Crear evento</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
