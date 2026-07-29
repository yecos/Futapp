'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Save, Loader2, Banknote, Palette, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'

interface OnboardingViewProps {
  teamId: string
  teamName: string
}

export function OnboardingView({ teamId, teamName }: OnboardingViewProps) {
  const router = useRouter()
  const { update } = useSession()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    primaryColor: '#16a34a',
    foundedYear: new Date().getFullYear(),
    bankName: 'Bancolombia',
    accountType: 'Ahorros',
    accountNumber: '',
    accountHolder: '',
    paymentInstructions: 'Transferir a la cuenta indicada y subir el comprobante en la app.',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        toast.error('Tu sesión expiró. Serás redirigido al login.')
        setTimeout(() => { window.location.href = '/login' }, 1500)
        return
      }
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }
      toast.success('¡Equipo configurado!')
      // Forzar refresh completo para que el JWT se actualice con onboardingCompleted=true
      await new Promise(r => setTimeout(r, 800))
      window.location.href = '/'
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-deportivo py-8 px-4">
      {/* Botón de cerrar sesión */}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="fixed top-4 right-4 z-50 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 border border-white/5 hover:bg-card text-muted-foreground hover:text-foreground transition-colors text-sm"
        title="Cerrar sesión"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </button>

      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-primary shadow-2xl glow-primary mb-4 animate-bounce-in">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black text-gradient-primary">Configura tu equipo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personaliza <strong className="text-foreground">{teamName}</strong> con tus colores y datos de pago
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Colores */}
          <Card className="border-white/10 bg-gradient-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
                  <Palette className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-bold text-sm">Identidad visual</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Color principal</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                      className="h-9 w-14 rounded border border-white/10 cursor-pointer bg-transparent"
                    />
                    <Input
                      value={form.primaryColor}
                      onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                      className="flex-1 bg-card/50"
                    />
                  </div>
                </div>
                <div>
                  <Label>Año de fundación</Label>
                  <Input
                    type="number"
                    value={form.foundedYear}
                    onChange={(e) => setForm({ ...form, foundedYear: parseInt(e.target.value) })}
                    className="mt-1 bg-card/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datos bancarios */}
          <Card className="border-white/10 bg-gradient-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20">
                  <Banknote className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="font-bold text-sm">Datos para pagos</h3>
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                Los jugadores usarán estos datos para pagar mensualidades por PSE, transferencia o QR.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Banco</Label>
                  <Input
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    className="mt-1 bg-card/50"
                  />
                </div>
                <div>
                  <Label>Tipo de cuenta</Label>
                  <select
                    value={form.accountType}
                    onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-card/50 px-3 py-1 text-sm"
                  >
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <Label>Número de cuenta *</Label>
                  <Input
                    value={form.accountNumber}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    placeholder="000-000000-00"
                    className="mt-1 bg-card/50"
                    required
                  />
                </div>
                <div>
                  <Label>Titular *</Label>
                  <Input
                    value={form.accountHolder}
                    onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                    className="mt-1 bg-card/50"
                    required
                  />
                </div>
              </div>

              <div className="mt-3">
                <Label>Instrucciones de pago</Label>
                <Textarea
                  value={form.paymentInstructions}
                  onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
                  rows={2}
                  className="mt-1 bg-card/50"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={saving}
            size="lg"
            className="w-full bg-gradient-primary h-12"
          >
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
