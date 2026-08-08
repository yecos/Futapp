'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Shield, UserPlus, Loader2, LogOut, Sparkles } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { toast } from 'sonner'

export function FreePlayerRegisterClient({ userName, userEmail }: { userName: string; userEmail: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fullName: userName,
    age: '',
    city: '',
    zone: '',
    primaryPosition: 'MEDIOCAMPISTA' as 'PORTERO' | 'DEFENSA' | 'MEDIOCAMPISTA' | 'DELANTERO',
    dominantFoot: 'DIESTRO' as 'DIESTRO' | 'ZURDO' | 'AMBIDIESTRO',
    height: '',
    weight: '',
    bio: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName || !form.age) {
      toast.error('Completa nombre y edad')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/free-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          age: parseInt(form.age),
          city: form.city || undefined,
          zone: form.zone || undefined,
          primaryPosition: form.primaryPosition,
          dominantFoot: form.dominantFoot,
          height: form.height ? parseInt(form.height) : undefined,
          weight: form.weight ? parseInt(form.weight) : undefined,
          bio: form.bio || undefined,
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
        throw new Error(err.error || 'Error al crear perfil')
      }

      toast.success('¡Perfil de jugador libre creado!')
      // Forzar refresh para que el JWT se actualice con isFreePlayer=true
      window.location.href = '/mi-carta'
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-deportivo">
      {/* Botón cerrar sesión */}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="absolute top-4 right-4 z-50 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 border border-white/5 hover:bg-card text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </button>

      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 animate-bounce-in">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-primary shadow-2xl glow-primary">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-3 text-gradient-primary">
              Jugador Libre
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crea tu carta, mide tu rendimiento y compártela
            </p>
          </div>

          <Card className="glass-strong border-white/10 shadow-2xl">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label>Nombre completo *</Label>
                  <Input
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Edad *</Label>
                    <Input
                      type="number"
                      min="5"
                      max="80"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                      placeholder="25"
                      required
                    />
                  </div>
                  <div>
                    <Label>Ciudad</Label>
                    <Input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="Medellín"
                    />
                  </div>
                </div>

                <div>
                  <Label>Zona / Barrio</Label>
                  <Input
                    value={form.zone}
                    onChange={(e) => setForm({ ...form, zone: e.target.value })}
                    placeholder="Laureles, Poblado..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Posición *</Label>
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
                  <Label>Bio (opcional)</Label>
                  <Textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Cuéntanos sobre ti como jugador..."
                    rows={3}
                    maxLength={1000}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-primary h-12"
                >
                  {saving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando perfil…</>
                  ) : (
                    <><UserPlus className="h-4 w-4 mr-2" />Crear mi carta de jugador</>
                  )}
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-xs text-center text-muted-foreground mb-2">
                  ¿Prefieres unirte a un equipo?
                </p>
                <Link
                  href="/choose-team"
                  className="block text-center text-sm text-primary hover:underline"
                >
                  Crear o unirse a un equipo →
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Conectado como <strong>{userEmail}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
