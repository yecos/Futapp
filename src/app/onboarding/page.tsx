'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    shortName: '',
    category: '',
    coachName: session?.user?.name || '',
    foundedYear: new Date().getFullYear(),
    primaryColor: '#16a34a',
    bankName: 'Bancolombia',
    accountType: 'Ahorros',
    accountNumber: '',
    accountHolder: '',
    paymentInstructions: 'Transferir a la cuenta indicada y subir el comprobante en la app.',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.shortName || !form.category || !form.coachName) {
      toast.error('Completa todos los campos obligatorios')
      return
    }
    if (!form.accountNumber || !form.accountHolder) {
      toast.error('Completa los datos bancarios para habilitar pagos')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/team/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }
      await update() // refrescar sesión con onboardingCompleted=true
      toast.success('Equipo configurado correctamente')
      router.push('/')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg mb-3">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Configura tu equipo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Como eres el primer usuario, eres el administrador. Configura los datos del equipo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Datos del equipo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos del equipo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Los Halcones FC"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shortName">Sigla *</Label>
                  <Input
                    id="shortName"
                    value={form.shortName}
                    onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                    placeholder="HFC"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="category">Categoría *</Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Senior Amateur"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="foundedYear">Año de fundación</Label>
                  <Input
                    id="foundedYear"
                    type="number"
                    value={form.foundedYear}
                    onChange={(e) => setForm({ ...form, foundedYear: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="coachName">Nombre del entrenador *</Label>
                <Input
                  id="coachName"
                  value={form.coachName}
                  onChange={(e) => setForm({ ...form, coachName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="primaryColor">Color principal</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="primaryColor"
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                    className="h-10 w-16 rounded border cursor-pointer"
                  />
                  <Input
                    value={form.primaryColor}
                    onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datos bancarios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos bancarios (para pagos)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Los jugadores usarán estos datos para hacer sus pagos por PSE, transferencia o QR Bancolombia.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bankName">Banco</Label>
                  <Input
                    id="bankName"
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="accountType">Tipo de cuenta</Label>
                  <select
                    id="accountType"
                    value={form.accountType}
                    onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="accountNumber">Número de cuenta *</Label>
                  <Input
                    id="accountNumber"
                    value={form.accountNumber}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    placeholder="000-000000-00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="accountHolder">Titular *</Label>
                  <Input
                    id="accountHolder"
                    value={form.accountHolder}
                    onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="paymentInstructions">Instrucciones de pago</Label>
                <Textarea
                  id="paymentInstructions"
                  value={form.paymentInstructions}
                  onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving} size="lg" className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar y empezar a usar Futapp
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
