'use client'

import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Clock, LogOut, ArrowRight, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export default function PendingPage() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // Refrescar sesión al montar para detectar si fue aprobado
    update().then(() => {
      router.refresh()
    })
  }, [])

  const handleLeaveTeam = async () => {
    setLeaving(true)
    try {
      const res = await fetch('/api/team/leave', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al salir')
      }
      await update()
      toast.success('Saliste del equipo')
      router.push('/choose-team')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLeaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-deportivo p-4">
      {/* Decoración */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/20 text-amber-400 shadow-lg mb-6 animate-bounce-in">
          <Clock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Esperando aprobación</h1>
        <p className="text-muted-foreground mb-6">
          Tu cuenta fue creada con <strong className="text-foreground">{session?.user?.email}</strong>, pero el administrador del equipo aún no ha aprobado tu acceso.
        </p>

        <div className="glass rounded-2xl border border-white/10 p-4 mb-6 text-left">
          <p className="font-medium text-sm mb-2">¿Qué puedes hacer?</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>Contacta al administrador del equipo para que apruebe tu solicitud</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>Pídele que revise la sección "Miembros" en la app</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>Recibirás acceso cuando sea aprobado</span>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleLeaveTeam}
            disabled={leaving}
            className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground font-medium h-11 px-4 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {leaving ? (
              <>
                <div className="h-4 w-4 mr-2 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                Saliendo…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Crear mi propio equipo
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </button>

          <p className="text-xs text-muted-foreground mb-2">
            Si no quieres esperar, puedes salir y crear tu propio equipo.
          </p>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full inline-flex items-center justify-center rounded-lg border border-input bg-background hover:bg-accent h-10 px-4 text-sm font-medium transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
