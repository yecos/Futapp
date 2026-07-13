'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Shield, Plus, KeyRound, ArrowRight, Loader2, Check,
} from 'lucide-react'
import { toast } from 'sonner'

type View = 'choose' | 'create' | 'join'

export default function ChooseTeamPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [view, setView] = useState<View>('choose')
  const [loading, setLoading] = useState(false)

  const [teamName, setTeamName] = useState('')
  const [shortName, setShortName] = useState('')
  const [category, setCategory] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  const handleCreateTeam = async () => {
    if (!teamName || !shortName || !category) {
      toast.error('Completa todos los campos')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/team/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName,
          shortName: shortName.toUpperCase(),
          category,
          coachName: session?.user?.name || 'Entrenador',
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear equipo')
      }
      toast.success('¡Equipo creado!')
      // FULL PAGE RELOAD - esto es clave para que el JWT se refresque
      // router.push() hace navegación client-side y reutiliza el JWT viejo
      // window.location.href fuerza una nueva request al server que refresca el JWT
      window.location.href = '/onboarding'
    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  const handleJoinTeam = async () => {
    if (!inviteCode) {
      toast.error('Ingresa el código de invitación')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteCode }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al unirse')
      }
      toast.success('¡Te uniste al equipo!')
      // FULL PAGE RELOAD
      window.location.href = '/'
    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-deportivo">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 field-pattern opacity-20" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-6 animate-bounce-in">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-primary shadow-2xl glow-primary">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-3 text-gradient-primary">Futapp</h1>
          </div>

          {/* Vista: choose */}
          {view === 'choose' && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold">¿Qué quieres hacer?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Crea un equipo nuevo o únete a uno existente
                </p>
              </div>
              <div className="space-y-3">
                <Card
                  className="border-primary/30 bg-gradient-to-br from-emerald-950/40 to-emerald-900/20 card-hover cursor-pointer"
                  onClick={() => setView('create')}
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 shrink-0">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm">Crear equipo nuevo</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Serás el administrador</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
                <Card
                  className="border-sky-500/30 bg-gradient-to-br from-sky-950/40 to-sky-900/20 card-hover cursor-pointer"
                  onClick={() => setView('join')}
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 shrink-0">
                      <KeyRound className="h-6 w-6 text-sky-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm">Tengo código de invitación</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Únete a un equipo existente</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Vista: create */}
          {view === 'create' && (
            <div className="animate-fade-in-up">
              <Card className="glass-strong border-white/10 shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base">Crear equipo nuevo</h2>
                      <p className="text-xs text-muted-foreground">Datos básicos del equipo</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label>Nombre del equipo *</Label>
                      <Input
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Ej: Los Halcones FC"
                        className="bg-card/50"
                      />
                    </div>
                    <div>
                      <Label>Sigla (3-4 letras) *</Label>
                      <Input
                        value={shortName}
                        onChange={(e) => setShortName(e.target.value.toUpperCase())}
                        placeholder="Ej: HFC"
                        maxLength={4}
                        className="bg-card/50 uppercase"
                      />
                    </div>
                    <div>
                      <Label>Categoría *</Label>
                      <Input
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Ej: Senior Amateur"
                        className="bg-card/50"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <Button variant="outline" onClick={() => setView('choose')} className="flex-1" disabled={loading}>
                      Volver
                    </Button>
                    <Button
                      onClick={handleCreateTeam}
                      disabled={loading || !teamName || !shortName || !category}
                      className="flex-1 bg-gradient-primary"
                    >
                      {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Creando…</> : <><Plus className="h-4 w-4 mr-1" />Crear equipo</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Vista: join */}
          {view === 'join' && (
            <div className="animate-fade-in-up">
              <Card className="glass-strong border-white/10 shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20">
                      <KeyRound className="h-5 w-5 text-sky-400" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base">Unirse con código</h2>
                      <p className="text-xs text-muted-foreground">Pega el código o link</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label>Código o link de invitación *</Label>
                      <Input
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Pega aquí el código o link"
                        className="bg-card/50 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <Button variant="outline" onClick={() => setView('choose')} className="flex-1" disabled={loading}>
                      Volver
                    </Button>
                    <Button
                      onClick={handleJoinTeam}
                      disabled={loading || !inviteCode}
                      className="flex-1 bg-gradient-to-r from-sky-500 to-sky-600"
                    >
                      {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Uniéndose…</> : <><Check className="h-4 w-4 mr-1" />Unirse</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
