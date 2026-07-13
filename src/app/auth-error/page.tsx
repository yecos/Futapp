'use client'

import { useSearchParams } from 'next/navigation'
import { AlertCircle, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const ERROR_MESSAGES: Record<string, string> = {
  Callback: 'El callback de autenticación falló. Esto puede ser un problema de conexión con la base de datos.',
  OAuthCallback: 'Google OAuth falló al procesar el callback.',
  OAuthCreateAccount: 'No se pudo crear la cuenta de usuario.',
  OAuthSignin: 'Error al iniciar sesión con Google.',
  AccessDenied: 'Acceso denegado. Es posible que tu cuenta de Google no tenga permisos.',
  Configuration: 'Error de configuración del servidor.',
  Verification: 'El token de verificación es inválido.',
  default: 'Error desconocido durante la autenticación.',
}

export default function AuthErrorPage() {
  const params = useSearchParams()
  const error = params.get('error') || 'default'
  const message = ERROR_MESSAGES[error] || ERROR_MESSAGES.default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-deportivo p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/20 text-red-400 shadow-lg mb-6">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Error de autenticación</h1>
        <p className="text-muted-foreground mb-2">{message}</p>
        <p className="text-xs text-muted-foreground mb-6">Código: <code className="text-red-400">{error}</code></p>

        <div className="glass rounded-2xl border border-white/10 p-4 mb-6 text-left">
          <p className="text-sm font-medium mb-2">Posibles soluciones:</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Limpia las cookies del navegador y vuelve a intentar</li>
            <li>• Usa una ventana de incógnito</li>
            <li>• Verifica que tu cuenta de Google sea correcta</li>
            <li>• Si el problema persiste, contacta al administrador</li>
          </ul>
        </div>

        <div className="space-y-2">
          <Link href="/login">
            <Button className="w-full" size="lg">Intentar de nuevo</Button>
          </Link>
          <Button variant="outline" className="w-full" onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  )
}
