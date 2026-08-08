'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Share2, Activity, MapPin, Footprints, Ruler, Weight, Pencil, Plus, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'

const POSITION_LABELS: Record<string, string> = {
  PORTERO: 'Portero',
  DEFENSA: 'Defensa',
  MEDIOCAMPISTA: 'Mediocampista',
  DELANTERO: 'Delantero',
}

const FOOT_LABELS: Record<string, string> = {
  DIESTRO: 'Diestro',
  ZURDO: 'Zurdo',
  AMBIDIESTRO: 'Ambidiestro',
}

const TEST_LABELS: Record<string, string> = {
  SALTO_VERTICAL: 'Salto Vertical',
  SPRINT_10M: 'Sprint 10m',
  SPRINT_20M: 'Sprint 20m',
  CAMBIO_DIRECCION: 'Cambio de Dirección',
  TOQUES_BALON: 'Toques de Balón',
  ANTROPOMETRIA: 'Antropometría',
}

const TEST_COLORS: Record<string, string> = {
  SALTO_VERTICAL: 'bg-amber-500/20 text-amber-400',
  SPRINT_10M: 'bg-sky-500/20 text-sky-400',
  SPRINT_20M: 'bg-sky-500/20 text-sky-400',
  CAMBIO_DIRECCION: 'bg-violet-500/20 text-violet-400',
  TOQUES_BALON: 'bg-emerald-500/20 text-emerald-400',
  ANTROPOMETRIA: 'bg-rose-500/20 text-rose-400',
}

export function MyCardClient({ freePlayer }: { freePlayer: any }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const publicUrl = `${window.location.origin}/carta/${freePlayer.id}`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Carta de ${freePlayer.fullName}`,
          text: `Mira mi carta de jugador en Futapp: ${freePlayer.fullName}`,
          url: publicUrl,
        })
      } catch (e) {
        // Cancelado
      }
    } else {
      navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const initials = freePlayer.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)

  return (
    <div className="relative min-h-screen bg-gradient-deportivo">
      {/* Botón cerrar sesión */}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="absolute top-4 right-4 z-50 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 border border-white/5 hover:bg-card text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </button>

      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Inicio
          </Link>
          <h1 className="text-xl font-bold mt-2">Mi Carta</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-24 space-y-4">
        {/* Carta principal */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-emerald-900/20 overflow-hidden">
          <CardContent className="p-0">
            {/* Header con foto */}
            <div className="relative p-6 flex items-center gap-4">
              <div className="shrink-0">
                {freePlayer.photoUrl ? (
                  <img
                    src={freePlayer.photoUrl}
                    alt={freePlayer.fullName}
                    className="h-20 w-20 rounded-2xl object-cover border-2 border-primary/30"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-black bg-gradient-to-br from-primary/40 to-primary/10 border-2 border-primary/30 text-primary-foreground">
                    {initials}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-black truncate">{freePlayer.fullName}</h2>
                <p className="text-sm text-muted-foreground">
                  {POSITION_LABELS[freePlayer.primaryPosition]}
                  {freePlayer.secondaryPosition && ` / ${POSITION_LABELS[freePlayer.secondaryPosition]}`}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{freePlayer.age} años</span>
                  {freePlayer.city && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{freePlayer.city}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase">Estado</p>
                <Badge variant="outline" className={freePlayer.isPublic ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted/20'}>
                  {freePlayer.isPublic ? 'PÚBLICA' : 'PRIVADA'}
                </Badge>
              </div>
            </div>

            {/* Stats físicas */}
            <div className="grid grid-cols-3 gap-px bg-white/5 border-t border-white/5">
              <div className="bg-card/30 p-3 text-center">
                <Footprints className="h-4 w-4 mx-auto text-primary mb-1" />
                <p className="text-[10px] text-muted-foreground">Pie</p>
                <p className="text-sm font-bold">{FOOT_LABELS[freePlayer.dominantFoot]}</p>
              </div>
              <div className="bg-card/30 p-3 text-center">
                <Ruler className="h-4 w-4 mx-auto text-primary mb-1" />
                <p className="text-[10px] text-muted-foreground">Altura</p>
                <p className="text-sm font-bold">{freePlayer.height ? `${freePlayer.height}cm` : '-'}</p>
              </div>
              <div className="bg-card/30 p-3 text-center">
                <Weight className="h-4 w-4 mx-auto text-primary mb-1" />
                <p className="text-[10px] text-muted-foreground">Peso</p>
                <p className="text-sm font-bold">{freePlayer.weight ? `${freePlayer.weight}kg` : '-'}</p>
              </div>
            </div>

            {/* Bio */}
            {freePlayer.bio && (
              <div className="p-4 border-t border-white/5">
                <p className="text-sm text-muted-foreground italic">"{freePlayer.bio}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleShare} className="bg-gradient-primary">
            <Share2 className="h-4 w-4 mr-2" />
            {copied ? 'Copiado!' : 'Compartir carta'}
          </Button>
          <Button variant="outline" onClick={() => router.push('/test-fisico')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo test
          </Button>
        </div>

        {/* Mejores marcas */}
        <Card className="border-white/5 bg-gradient-card">
          <CardContent className="p-5">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Mejores marcas
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-amber-500/10">
                <p className="text-[10px] text-muted-foreground uppercase">Salto V.</p>
                <p className="text-2xl font-black text-amber-400">
                  {freePlayer.bestVerticalJumpCm || '-'}
                </p>
                <p className="text-[10px] text-muted-foreground">cm</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-sky-500/10">
                <p className="text-[10px] text-muted-foreground uppercase">Sprint 10m</p>
                <p className="text-2xl font-black text-sky-400">
                  {freePlayer.bestSprint10Sec ? freePlayer.bestSprint10Sec.toFixed(2) : '-'}
                </p>
                <p className="text-[10px] text-muted-foreground">seg</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-sky-500/10">
                <p className="text-[10px] text-muted-foreground uppercase">Sprint 20m</p>
                <p className="text-2xl font-black text-sky-400">
                  {freePlayer.bestSprint20Sec ? freePlayer.bestSprint20Sec.toFixed(2) : '-'}
                </p>
                <p className="text-[10px] text-muted-foreground">seg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historial de tests */}
        <Card className="border-white/5 bg-gradient-card">
          <CardContent className="p-5">
            <h3 className="font-bold text-sm mb-3">Historial de tests ({freePlayer.testResults.length})</h3>
            {freePlayer.testResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aún no has hecho tests. ¡Empieza con el salto vertical!
              </p>
            ) : (
              <div className="space-y-2">
                {freePlayer.testResults.map((test: any) => (
                  <div key={test.id} className="flex items-center gap-3 p-2 rounded-lg bg-card/30">
                    <Badge variant="outline" className={`text-[10px] ${TEST_COLORS[test.type] || ''}`}>
                      {TEST_LABELS[test.type] || test.type}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-bold">
                        {test.value} {test.unit}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(test.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[9px] ${
                      test.status === 'VERIFICADO' ? 'bg-emerald-500/20 text-emerald-400' :
                      test.status === 'RECHAZADO' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-muted/20 text-muted-foreground'
                    }`}>
                      {test.status === 'VERIFICADO' ? 'Verificado' :
                       test.status === 'RECHAZADO' ? 'Rechazado' :
                       'Sin verificar'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
