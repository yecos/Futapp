'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/permissions'

interface InviteLandingProps {
  token: string
  teamName: string
  role: string
}

export function InviteLanding({ token, teamName, role }: InviteLandingProps) {
  const [loading, setLoading] = useState(false)

  const handleAccept = () => {
    setLoading(true)
    // El canje se hace en el callback de signIn via JWT callback
    // Pasamos el token como callbackUrl para que el middleware lo procese
    signIn('google', { callbackUrl: `/invite/${token}?accept=1` })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">¡Bienvenido!</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fuiste invitado a unirte a <strong>{teamName}</strong>
          </p>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm p-6">
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1">Tu rol será:</p>
            <p className="font-bold text-lg">
              {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS]}
            </p>
          </div>

          <Button onClick={handleAccept} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <div className="h-4 w-4 mr-2 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                Conectando…
              </>
            ) : (
              <>
                Aceptar invitación con Google
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Al continuar, serás redirigido a Google para iniciar sesión.
          </p>
        </div>
      </div>
    </div>
  )
}
