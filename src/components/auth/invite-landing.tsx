'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Shield, ArrowRight, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/permissions'
import { toast } from 'sonner'

interface InviteLandingProps {
  token: string
  teamName: string
  role: string
}

export function InviteLanding({ token, teamName, role }: InviteLandingProps) {
  const [loading, setLoading] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Si no está logueado → login con Google, luego volver aquí
  const handleAccept = async () => {
    // Si no hay sesión, ir a login y volver
    if (status === 'unauthenticated' || !session?.user) {
      // Guardar el token en sessionStorage para recuperarlo después del login
      sessionStorage.setItem('pendingInviteToken', token)
      // Ir a login
      window.location.href = '/login?callbackUrl=' + encodeURIComponent('/invite/' + token)
      return
    }

    // Si hay sesión, canjear el invite via API
    setLoading(true)
    try {
      const res = await fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al unirse')
      }
      setAccepted(true)
      toast.success('¡Te uniste al equipo!')
      setTimeout(() => {
        window.location.href = '/'
      }, 1500)
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
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 animate-bounce-in">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-primary shadow-2xl glow-primary">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-3 text-gradient-primary">
              {accepted ? '¡Bienvenido!' : '¡Bienvenido!'}
            </h1>
            {!accepted && (
              <p className="text-sm text-muted-foreground mt-1">
                Fuiste invitado a unirte a <strong>{teamName}</strong>
              </p>
            )}
          </div>

          {accepted ? (
            <div className="glass-strong rounded-2xl border border-white/10 shadow-2xl p-6 text-center animate-scale-in">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-4">
                <Check className="h-7 w-7" />
              </div>
              <h2 className="font-bold text-lg">¡Te uniste al equipo!</h2>
              <p className="text-sm text-muted-foreground mt-1">Redirigiendo al dashboard...</p>
            </div>
          ) : (
            <div className="glass-strong rounded-2xl border border-white/10 shadow-2xl p-6">
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-1">Tu rol será:</p>
                <p className="font-bold text-lg">{ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS]}
                </p>
              </div>

              {session?.user && (
                <div className="mb-4 p-3 rounded-lg bg-card/50 text-sm">
                  <p className="text-muted-foreground">Conectado como:</p>
                  <p className="font-medium">{session.user.email}</p>
                </div>
              )}

              <Button
                onClick={handleAccept}
                disabled={loading}
                className="w-full bg-gradient-primary"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uniéndose…
                  </>
                ) : session?.user ? (
                  <>
                    Aceptar invitación
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Continuar con Google
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                {session?.user
                  ? 'Se te unirá al equipo con el rol indicado.'
                  : 'Inicia sesión con Google para aceptar la invitación.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
