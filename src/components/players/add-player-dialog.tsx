'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface AddPlayerDialogProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export function AddPlayerDialog({ open, onClose, onCreated }: AddPlayerDialogProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    jerseyNumber: '',
    primaryPosition: 'MEDIOCAMPISTA' as 'PORTERO' | 'DEFENSA' | 'MEDIOCAMPISTA' | 'DELANTERO',
    age: '25',
    dominantFoot: 'DIESTRO' as 'DIESTRO' | 'ZURDO' | 'AMBIDIESTRO',
    height: '',
    weight: '',
    phone: '',
    emergencyContact: '',
    status: 'DISPONIBLE' as 'DISPONIBLE' | 'LESIONADO' | 'SUSPENDIDO' | 'AUSENTE',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.jerseyNumber || !form.age) {
      toast.error('Completa los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          jerseyNumber: parseInt(form.jerseyNumber),
          primaryPosition: form.primaryPosition,
          age: parseInt(form.age),
          dominantFoot: form.dominantFoot,
          height: form.height ? parseInt(form.height) : undefined,
          weight: form.weight ? parseInt(form.weight) : undefined,
          phone: form.phone || undefined,
          emergencyContact: form.emergencyContact || undefined,
          status: form.status,
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
        throw new Error(err.error || 'Error al crear jugador')
      }

      toast.success('Jugador agregado a la plantilla')
      setForm({
        firstName: '', lastName: '', jerseyNumber: '',
        primaryPosition: 'MEDIOCAMPISTA', age: '25',
        dominantFoot: 'DIESTRO', height: '', weight: '',
        phone: '', emergencyContact: '', status: 'DISPONIBLE',
      })
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Agregar jugador
          </DialogTitle>
          <DialogDescription>
            Agrega un jugador a la plantilla del equipo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Andrés"
                required
              />
            </div>
            <div>
              <Label>Apellido *</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Gómez"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Dorsal *</Label>
              <Input
                type="number"
                min="0"
                max="99"
                value={form.jerseyNumber}
                onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })}
                placeholder="10"
                required
              />
            </div>
            <div>
              <Label>Edad *</Label>
              <Input
                type="number"
                min="5"
                max="80"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Posición principal *</Label>
              <Select
                value={form.primaryPosition}
                onValueChange={(v) => setForm({ ...form, primaryPosition: v as any })}
              >
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
              <Label>Pierna dominante</Label>
              <Select
                value={form.dominantFoot}
                onValueChange={(v) => setForm({ ...form, dominantFoot: v as any })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIESTRO">Diestro</SelectItem>
                  <SelectItem value="ZURDO">Zurdo</SelectItem>
                  <SelectItem value="AMBIDIESTRO">Ambidiestro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Altura (cm)</Label>
              <Input
                type="number"
                min="100"
                max="250"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder="175"
              />
            </div>
            <div>
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                min="30"
                max="200"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="72"
              />
            </div>
          </div>

          <div>
            <Label>Teléfono</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="300 123 4567"
            />
          </div>

          <div>
            <Label>Contacto de emergencia</Label>
            <Input
              value={form.emergencyContact}
              onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
              placeholder="María - 300 987 6543"
            />
          </div>

          <div>
            <Label>Estado</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as any })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                <SelectItem value="LESIONADO">Lesionado</SelectItem>
                <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
                <SelectItem value="AUSENTE">Ausente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Agregando…</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-2" />Agregar jugador</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
