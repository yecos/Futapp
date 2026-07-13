'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-deportivo p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/20 text-red-400 shadow-lg mb-6">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Algo salió mal</h1>
        <p className="text-muted-foreground mb-6">
          Ha ocurrido un error inesperado. Intenta de nuevo.
        </p>
        <Button onClick={reset} size="lg" className="w-full">
          Intentar de nuevo
        </Button>
      </div>
    </div>
  )
}
