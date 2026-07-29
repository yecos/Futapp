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
import { Loader2, Plus, Pin } from 'lucide-react'
import { toast } from 'sonner'

interface CreateAnnouncementDialogProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
  canPin?: boolean
}

export function CreateAnnouncementDialog({
  open, onClose, onCreated, canPin = false,
}: CreateAnnouncementDialogProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'GENERAL' as 'GENERAL' | 'CONVOCATORIA' | 'EVENTO' | 'URGENTE' | 'PAGO',
    pinned: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.content) {
      toast.error('Completa título y contenido')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        toast.error('Tu sesión expiró.')
        setTimeout(() => { window.location.href = '/login' }, 1500)
        return
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear aviso')
      }

      toast.success('Aviso publicado')
      setForm({ title: '', content: '', category: 'GENERAL', pinned: false })
      onClose()
      onCreated?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo aviso</DialogTitle>
          <DialogDescription>Publica un aviso para todo el equipo</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Entrenamiento suspendido"
              required
            />
          </div>

          <div>
            <Label>Categoría</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v as any })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="CONVOCATORIA">Convocatoria</SelectItem>
                <SelectItem value="EVENTO">Evento</SelectItem>
                <SelectItem value="URGENTE">Urgente</SelectItem>
                <SelectItem value="PAGO">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Contenido *</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Escribe el mensaje..."
              rows={5}
              required
            />
          </div>

          {canPin && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm flex items-center gap-1">
                <Pin className="h-3 w-3 text-amber-400" />
                Fijar arriba del todo
              </span>
            </label>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Publicando…</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" />Publicar</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
