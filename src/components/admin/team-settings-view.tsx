'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TeamData {
  name: string
  shortName: string
  category: string
  coachName: string
  primaryColor: string
  secondaryColor: string
  foundedYear: number
  description: string
  bankName: string
  accountType: string
  accountNumber: string
  accountHolder: string
  paymentInstructions: string
}

export function TeamSettingsView({ team: initialTeam }: { team: TeamData }) {
  const [team, setTeam] = useState<TeamData>(initialTeam)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!team.name || !team.shortName || !team.accountNumber || !team.accountHolder) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(team),
      })
      if (!res.ok) throw new Error('Error al guardar')
      toast.success('Cambios guardados')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link href="/" className="inline-flex items-center text-sm text-primary-foreground/90 hover:text-primary-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
          <h1 className="text-xl font-bold mt-2">Configuración del Equipo</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        {/* Datos básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={team.name}
                  onChange={(e) => setTeam({ ...team, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Sigla *</Label>
                <Input
                  value={team.shortName}
                  onChange={(e) => setTeam({ ...team, shortName: e.target.value })}
                  maxLength={4}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoría</Label>
                <Input
                  value={team.category}
                  onChange={(e) => setTeam({ ...team, category: e.target.value })}
                />
              </div>
              <div>
                <Label>Año fundación</Label>
                <Input
                  type="number"
                  value={team.foundedYear}
                  onChange={(e) => setTeam({ ...team, foundedYear: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Entrenador</Label>
              <Input
                value={team.coachName}
                onChange={(e) => setTeam({ ...team, coachName: e.target.value })}
              />
            </div>
            <div>
              <Label>Color principal</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={team.primaryColor}
                  onChange={(e) => setTeam({ ...team, primaryColor: e.target.value })}
                  className="h-9 w-16 rounded border cursor-pointer"
                />
                <Input
                  value={team.primaryColor}
                  onChange={(e) => setTeam({ ...team, primaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={team.description}
                onChange={(e) => setTeam({ ...team, description: e.target.value })}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Datos bancarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos bancarios (para pagos)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Banco</Label>
                <Input
                  value={team.bankName}
                  onChange={(e) => setTeam({ ...team, bankName: e.target.value })}
                />
              </div>
              <div>
                <Label>Tipo de cuenta</Label>
                <select
                  value={team.accountType}
                  onChange={(e) => setTeam({ ...team, accountType: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="Ahorros">Ahorros</option>
                  <option value="Corriente">Corriente</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Número de cuenta *</Label>
                <Input
                  value={team.accountNumber}
                  onChange={(e) => setTeam({ ...team, accountNumber: e.target.value })}
                  placeholder="000-000000-00"
                />
              </div>
              <div>
                <Label>Titular *</Label>
                <Input
                  value={team.accountHolder}
                  onChange={(e) => setTeam({ ...team, accountHolder: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Instrucciones de pago</Label>
              <Textarea
                value={team.paymentInstructions}
                onChange={(e) => setTeam({ ...team, paymentInstructions: e.target.value })}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando…
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar cambios
            </>
          )}
        </Button>
      </main>
    </div>
  )
}
