'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft, Plus, DollarSign, Clock, CheckCircle2, Upload, AlertCircle, X, Image as ImageIcon, Pencil, Trash2, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Player {
  id: string
  fullName: string
  jerseyNumber: number
  primaryPosition: string
}

interface Receipt {
  id: string
  status: string
  receiptUrl: string
  uploadedAt: string
  reviewedAt: string | null
  rejectionReason: string | null
  amount: number | null
  reference: string | null
  player: { id: string; fullName: string; jerseyNumber: number }
}

interface Payment {
  id: string
  title: string
  description: string | null
  type: string
  amount: number
  dueDate: string
  status: string
  recurrence: string
  receipts: Receipt[]
}

const TYPE_LABELS: Record<string, string> = {
  MENSUALIDAD: 'Mensualidad', ARBITRAJE: 'Arbitraje', UNIFORME: 'Uniforme',
  INSCRIPCION: 'Inscripción', EVENTO: 'Evento', MULTA: 'Multa', OTRO: 'Otro',
}

const STATUS_BADGES: Record<string, { label: string; class: string }> = {
  PENDIENTE: { label: 'Pendiente', class: 'bg-amber-100 text-amber-700' },
  PAGADO: { label: 'En revisión', class: 'bg-sky-100 text-sky-700' },
  VERIFICADO: { label: 'Verificado', class: 'bg-emerald-100 text-emerald-700' },
  RECHAZADO: { label: 'Rechazado', class: 'bg-rose-100 text-rose-700' },
  VENCIDO: { label: 'Vencido', class: 'bg-rose-100 text-rose-700' },
}

export function AdminPaymentsView({
  payments,
  players,
  totalRecaudado,
  pendientesVerificacion,
}: {
  payments: Payment[]
  players: Player[]
  totalRecaudado: number
  pendientesVerificacion: number
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar el cobro "${title}"? Esta acción eliminará también todos los comprobantes asociados.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar')
      }
      toast.success('Cobro eliminado')
      setTimeout(() => window.location.reload(), 800)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link href="/" className="inline-flex items-center text-sm text-primary-foreground/90 hover:text-primary-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-xl font-bold">Gestión de Pagos</h1>
            <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo cobro
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <p className="text-[10px] text-muted-foreground uppercase">Recaudado</p>
              </div>
              <p className="text-lg font-bold text-emerald-600 mt-1">
                ${totalRecaudado.toLocaleString('es-CO')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <p className="text-[10px] text-muted-foreground uppercase">Por verificar</p>
              </div>
              <p className="text-lg font-bold text-amber-600 mt-1">{pendientesVerificacion}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                <p className="text-[10px] text-muted-foreground uppercase">Pendientes</p>
              </div>
              <p className="text-lg font-bold text-rose-600 mt-1">
                {payments.filter((p) => p.status === 'PENDIENTE').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Comprobantes pendientes de verificación */}
        {pendientesVerificacion > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-amber-600" />
                Comprobantes por verificar ({pendientesVerificacion})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {payments.flatMap((p) =>
                p.receipts
                  .filter((r) => r.status === 'PAGADO')
                  .map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedReceipt(r)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted text-left"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          #{r.player.jerseyNumber} {r.player.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.title} - ${r.amount?.toLocaleString('es-CO') || p.amount.toLocaleString('es-CO')}
                        </p>
                      </div>
                      <span className="text-xs text-primary">Revisar →</span>
                    </button>
                  ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Lista de cobros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Todos los cobros ({payments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay cobros creados todavía.
              </p>
            )}
            {payments.map((payment) => {
              const badge = STATUS_BADGES[payment.status] || STATUS_BADGES.PENDIENTE
              const verifiedCount = payment.receipts.filter((r) => r.status === 'VERIFICADO').length
              return (
                <div key={payment.id} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          {TYPE_LABELS[payment.type] || payment.type}
                        </Badge>
                        <Badge className={cn('text-[10px]', badge.class)}>{badge.label}</Badge>
                        {payment.recurrence !== 'UNICO' && (
                          <Badge variant="secondary" className="text-[10px]">
                            {payment.recurrence.toLowerCase()}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm">{payment.title}</h3>
                      {payment.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{payment.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold">${payment.amount.toLocaleString('es-CO')}</p>
                      <p className="text-xs text-muted-foreground">
                        Vence: {new Date(payment.dueDate).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        {verifiedCount} verificados
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-600" />
                        {payment.receipts.filter((r) => r.status === 'PAGADO').length} por revisar
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingPayment(payment)}
                        className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Editar cobro"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(payment.id, payment.title)}
                        disabled={deletingId === payment.id}
                        className="p-1.5 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                        title="Eliminar cobro"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </main>

      {showCreate && (
        <CreatePaymentDialog
          players={players}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            toast.success('Cobro creado')
            setTimeout(() => window.location.reload(), 800)
          }}
        />
      )}

      {selectedReceipt && (
        <VerifyReceiptDialog
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onVerified={() => {
            setSelectedReceipt(null)
            setTimeout(() => window.location.reload(), 800)
          }}
        />
      )}

      {editingPayment && (
        <EditPaymentDialog
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSaved={() => {
            setEditingPayment(null)
            toast.success('Cobro actualizado')
            setTimeout(() => window.location.reload(), 800)
          }}
        />
      )}
    </div>
  )
}

// =====================================================
// COMPONENTE: Editar cobro existente
// =====================================================

function EditPaymentDialog({
  payment, onClose, onSaved,
}: {
  payment: Payment
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: payment.title,
    description: payment.description || '',
    amount: String(payment.amount),
    dueDate: new Date(payment.dueDate).toISOString().split('T')[0],
    status: payment.status,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.amount || !form.dueDate) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          amount: parseFloat(form.amount),
          dueDate: form.dueDate,
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
        throw new Error(err.error || 'Error al actualizar')
      }

      onSaved()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar cobro</DialogTitle>
          <DialogDescription>Modifica los datos del cobro</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Monto (COP) *</Label>
              <Input
                type="number"
                min="1"
                step="any"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Vencimiento *</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Estado</Label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="PAGADO">Pagado</option>
              <option value="VERIFICADO">Verificado</option>
              <option value="RECHAZADO">Rechazado</option>
              <option value="VENCIDO">Vencido</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Pencil className="h-4 w-4 mr-2" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CreatePaymentDialog({
  players, onClose, onCreated,
}: {
  players: Player[]
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'MENSUALIDAD',
    amount: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    recurrence: 'UNICO',
  })
  const [appliesAll, setAppliesAll] = useState(true)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.title || !form.amount) {
      toast.error('Completa título y monto')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          dueDate: new Date(form.dueDate).toISOString(),
          appliesTo: appliesAll ? ['ALL'] : selectedPlayers,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear')
      }
      onCreated()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear nuevo cobro</DialogTitle>
          <DialogDescription>Crea un cobro para uno o todos los jugadores.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Mensualidad Julio 2026"
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="MENSUALIDAD">Mensualidad</option>
                <option value="ARBITRAJE">Arbitraje</option>
                <option value="UNIFORME">Uniforme</option>
                <option value="INSCRIPCION">Inscripción</option>
                <option value="EVENTO">Evento</option>
                <option value="MULTA">Multa</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div>
              <Label>Recurrencia</Label>
              <select
                value={form.recurrence}
                onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="UNICO">Único</option>
                <option value="MENSUAL">Mensual</option>
                <option value="SEMESTRAL">Semestral</option>
                <option value="ANUAL">Anual</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Monto (COP) *</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="40000"
              />
            </div>
            <div>
              <Label>Vencimiento</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Aplica a</Label>
            <div className="flex gap-3 mt-1">
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  checked={appliesAll}
                  onChange={() => setAppliesAll(true)}
                />
                Todo el equipo
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  checked={!appliesAll}
                  onChange={() => setAppliesAll(false)}
                />
                Jugadores específicos
              </label>
            </div>
            {!appliesAll && (
              <div className="max-h-40 overflow-y-auto mt-2 border rounded p-2 space-y-1">
                {players.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedPlayers([...selectedPlayers, p.id])
                        else setSelectedPlayers(selectedPlayers.filter((id) => id !== p.id))
                      }}
                    />
                    #{p.jerseyNumber} {p.fullName}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creando…' : 'Crear cobro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function VerifyReceiptDialog({
  receipt, onClose, onVerified,
}: {
  receipt: Receipt
  onClose: () => void
  onVerified: () => void
}) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [saving, setSaving] = useState(false)

  const handleVerify = async (status: 'VERIFICADO' | 'RECHAZADO') => {
    if (status === 'RECHAZADO' && !rejectionReason) {
      toast.error('Indica el motivo del rechazo')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/payments/${receipt.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: status === 'RECHAZADO' ? rejectionReason : undefined }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al verificar')
      }
      toast.success(status === 'VERIFICADO' ? 'Comprobante aprobado' : 'Comprobante rechazado')
      onVerified()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const isImage = receipt.receiptUrl.startsWith('data:image/')

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verificar comprobante</DialogTitle>
          <DialogDescription>
            #{receipt.player.jerseyNumber} {receipt.player.fullName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Monto</p>
              <p className="font-bold">
                ${receipt.amount?.toLocaleString('es-CO') || 'No especificado'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Referencia</p>
              <p className="font-mono">{receipt.reference || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subido</p>
              <p>{new Date(receipt.uploadedAt).toLocaleString('es-CO')}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Comprobante:</p>
            {isImage ? (
              <img
                src={receipt.receiptUrl}
                alt="Comprobante"
                className="w-full rounded-lg border max-h-96 object-contain"
              />
            ) : (
              <a
                href={receipt.receiptUrl}
                download="comprobante.pdf"
                className="flex items-center gap-2 p-3 rounded border hover:bg-muted"
              >
                <ImageIcon className="h-5 w-5" />
                <span className="text-sm">Descargar PDF</span>
              </a>
            )}
          </div>

          <div>
            <Label>Motivo del rechazo (si aplica)</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              placeholder="Ej: Monto incorrecto, no se ve la referencia, etc."
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleVerify('RECHAZADO')}
            disabled={saving}
            className="text-rose-600 border-rose-300 hover:bg-rose-50"
          >
            <X className="h-4 w-4 mr-1" />
            Rechazar
          </Button>
          <Button
            onClick={() => handleVerify('VERIFICADO')}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Aprobar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
