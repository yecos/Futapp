import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { Shield, Clock, LogOut } from 'lucide-react'
import { signOutButtonAction } from './actions'

export default async function PendingPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 mb-6">
          <Clock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Esperando aprobación</h1>
        <p className="text-muted-foreground mb-6">
          Tu cuenta fue creada con <strong>{session.user.email}</strong>, pero el
          administrador del equipo aún no ha aprobado tu acceso.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 mb-6 text-sm">
          <p className="font-medium mb-1">¿Qué puedes hacer?</p>
          <ul className="text-left space-y-1 text-muted-foreground">
            <li>• Contacta al administrador del equipo</li>
            <li>• Pídele que apruebe tu solicitud en la sección "Miembros"</li>
            <li>• Recibirás acceso cuando sea aprobado</li>
          </ul>
        </div>
        <form action={signOutButtonAction}>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-9 px-4"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}
