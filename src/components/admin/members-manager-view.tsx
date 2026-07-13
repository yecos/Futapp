'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft, UserPlus, Copy, Check, Clock, CheckCircle2, X, Link as LinkIcon, Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ASSIGNABLE_ROLES } from '@/lib/permissions'

interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  phoneNumber: string | null
}

interface Membership {
  id: string
  userId: string
  role: string
  status: string
  joinedAt: string | null
  user: User
}

interface Invite {
  id: string
  token: string
  role: string
  email: string | null
  expiresAt: string
  createdAt: string
}

const STATUS_BADGES: Record<string, { label: string; class: string }> = {
  ACTIVO: { label: 'Activo', class: 'bg-emerald-100 text-emerald-700' },
  PENDIENTE: { label: 'Pendiente', class: 'bg-amber-100 text-amber-700' },
  RETIRADO: { label: 'Retirado', class: 'bg-zinc-100 text-zinc-700' },
  BLOQUEADO: { label: 'Bloqueado', class: 'bg-rose-100 text-rose-700' },
}

export function MembersManagerView({
  memberships: initialMemberships,
  invites: initialInvites,
}: {
  memberships: Membership[]
  invites: Invite[]
}) {
  const [memberships, setMemberships] = useState(initialMemberships)
  const [invites, setInvites] = useState(initialInvites)
  const [showInvite, setShowInvite] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const updateMember = async (membershipId: string, action: 'approve' | 'reject' | 'changeRole', newRole?: string) => {
    try {
      const res = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, action, newRole }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      const updated = await res.json()
      setMemberships(memberships.map((m) => (m.id === membershipId ? { ...m, ...updated } : m)))
      toast.success('Actualizado')
      // Full reload para que el JWT se refresque con el nuevo rol
      setTimeout(() => window.location.reload(), 800)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link href="/" className="inline-flex items-center text-sm text-primary-foreground/90 hover:text-primary-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-xl font-bold">Miembros del Equipo</h1>
            <Button variant="secondary" size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus className="h-4 w-4 mr-1" />
              Generar invitación
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        {/* Invitaciones activas */}
        {invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Links de invitación activos ({invites.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Rol: {ROLE_LABELS[inv.role as keyof typeof ROLE_LABELS] || inv.role}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expira: {new Date(inv.expiresAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyInviteLink(inv.token)}
                  >
                    {copiedToken === inv.token ? (
                      <><Check className="h-3 w-3 mr-1" /> Copiado</>
                    ) : (
                      <><Copy className="h-3 w-3 mr-1" /> Copiar link</>
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Solicitudes pendientes */}
        {memberships.filter((m) => m.status === 'PENDIENTE').length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Solicitudes pendientes ({memberships.filter((m) => m.status === 'PENDIENTE').length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {memberships
                .filter((m) => m.status === 'PENDIENTE')
                .map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded border">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{m.user.name || m.user.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateMember(m.id, 'approve')}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateMember(m.id, 'reject')}
                        className="text-rose-600 border-rose-300 hover:bg-rose-50"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Lista de miembros activos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Miembros ({memberships.filter((m) => m.status === 'ACTIVO').length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {memberships
              .filter((m) => m.status === 'ACTIVO')
              .map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded border">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{m.user.name || m.user.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={m.role}
                      onValueChange={(newRole) => updateMember(m.id, 'changeRole', newRole)}
                    >
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            {memberships.filter((m) => m.status === 'ACTIVO').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay miembros activos todavía.
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      {showInvite && (
        <CreateInviteDialog
          onClose={() => setShowInvite(false)}
          onCreated={(newInvite) => {
            setInvites([newInvite, ...invites])
            setShowInvite(false)
            toast.success('Invitación creada')
          }}
        />
      )}
    </div>
  )
}

function CreateInviteDialog({
  onClose, onCreated,
}: {
  onClose: () => void
  onCreated: (invite: Invite) => void
}) {
  const [role, setRole] = useState('JUGADOR')
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, expiresInDays }),
      })
      if (!res.ok) throw new Error('Error al crear invitación')
      const invite = await res.json()
      onCreated(invite)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generar link de invitación</DialogTitle>
          <DialogDescription>
            Comparte este link con la persona que quieres invitar. Podrá registrarse con Google.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Rol que tendrá</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]} — {ROLE_DESCRIPTIONS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Vence en</Label>
            <Select value={String(expiresInDays)} onValueChange={(v) => setExpiresInDays(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 día</SelectItem>
                <SelectItem value="3">3 días</SelectItem>
                <SelectItem value="7">7 días</SelectItem>
                <SelectItem value="30">30 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? 'Creando…' : 'Generar link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
