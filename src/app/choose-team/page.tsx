'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Shield, Plus, KeyRound, ArrowRight, Loader2, Check, AlertCircle, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

type View = 'choose' | 'create' | 'join'

export default function ChooseTeamPage() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [view, setView] = useState<View>('choose')
  const [loading, setLoading] = useState(false)

  // Form crear equipo
  const [teamName, setTeamName] = useState('')
  const [shortName, setShortName] = useState('')
  const [category, setCategory] = useState('')

  // Form unirse con código
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
      const data = await res.json()
      await update() // refrescar sesión con nuevo teamId
      toast.success('¡Equipo creado!')
      router.push('/onboarding')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
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
      await update()
      toast.success('¡Te uniste al equipo!')
      router.push('/')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-deportivo">
      {/* Decoración */}
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
            <h1 className="text-2xl font-black tracking-tight mt-3 text-gradient-primary">
              Futapp
            </h1>
          </div>

          {/* Vista: choose */}
          {view === 'choose' && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold">¿Qué quieres hacer?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Crea un equipo nuevo o únete a uno existente con un código
                </p>
              </div>

              <div className="space-y-3">
                {/* Crear equipo */}
                <Card
                  className="border-primary/30 bg-gradient-to-br from-emerald-950/40 to-emerald-900/20 card-hover cursor-pointer"
                  onClick={() => setView('create')}
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 shrink-0">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm">Crear equipo nuevo</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Serás el administrador del equipo
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>

                {/* Unirse con código */}
                <Card
                  className="border-sky-500/30 bg-gradient-to-br from-sky-950/40 to-sky-900/20 card-hover cursor-pointer"
                  onClick={() => setView('join')}
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 shrink-0">
                      <KeyRound className="h-6 w-6 text-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm">Tengo código de invitación</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Únete a un equipo existente
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  ¿Cómo funcionan los códigos? El administrador del equipo genera un link desde la sección Miembros y lo comparte por WhatsApp.
                </p>
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
                      <p className="text-xs text-muted-foreground">Configura los datos básicos</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="teamName">Nombre del equipo *</Label>
                      <Input
                        id="teamName"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Ej: Los Halcones FC"
                        className="bg-card/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shortName">Sigla (3-4 letras) *</Label>
                      <Input
                        id="shortName"
                        value={shortName}
                        onChange={(e) => setShortName(e.target.value.toUpperCase())}
                        placeholder="Ej: HFC"
                        maxLength={4}
                        className="bg-card/50 uppercase"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Categoría *</Label>
                      <Input
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Ej: Senior Amateur"
                        className="bg-card/50"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-5">
                    <Button
                      variant="outline"
                      onClick={() => setView('choose')}
                      className="flex-1"
                      disabled={loading}
                    >
                      Volver
                    </Button>
                    <Button
                      onClick={handleCreateTeam}
                      disabled={loading || !teamName || !shortName || !category}
                      className="flex-1 bg-gradient-primary"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Creando…
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          Crear equipo
                        </>
                      )}
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
                      <p className="text-xs text-muted-foreground">Pega el código o link de invitación</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="inviteCode">Código o link de invitación *</Label>
                      <Input
                        id="inviteCode"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Pega aquí el código o link completo"
                        className="bg-card/50 font-mono text-sm"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        El código se ve así: <code className="text-primary">abc-123-xyz</code> o pega el link completo que te enviaron
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-5">
                    <Button
                      variant="outline"
                      onClick={() => setView('choose')}
                      className="flex-1"
                      disabled={loading}
                    >
                      Volver
                    </Button>
                    <Button
                      onClick={handleJoinTeam}
                      disabled={loading || !inviteCode}
                      className="flex-1 bg-gradient-to-r from-sky-500 to-sky-600"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Uniéndose…
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Unirse al equipo
                        </>
                      )}
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
