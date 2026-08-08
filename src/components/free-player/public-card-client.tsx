'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Share2, MapPin, Footprints, Ruler, Weight, Activity, Shield, Download } from 'lucide-react'
import { useState } from 'react'
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

export function PublicCardClient({ freePlayer }: { freePlayer: any }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Carta de ${freePlayer.fullName}`,
          text: `Mira la carta de ${freePlayer.fullName} en Futapp`,
          url,
        })
      } catch (e) {
        // Cancelado
      }
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const initials = freePlayer.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <main className="mx-auto max-w-2xl px-4 py-6 pb-24 space-y-4">
        {/* Logo Futapp */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Futapp</span>
          </div>
        </div>

        {/* Carta principal */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-emerald-900/20 overflow-hidden">
          <CardContent className="p-0">
            {/* Header */}
            <div className="relative p-6 flex items-center gap-4">
              <div className="shrink-0">
                {freePlayer.photoUrl ? (
                  <img
                    src={freePlayer.photoUrl}
                    alt={freePlayer.fullName}
                    className="h-24 w-24 rounded-2xl object-cover border-2 border-primary/30"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl flex items-center justify-center text-3xl font-black bg-gradient-to-br from-primary/40 to-primary/10 border-2 border-primary/30 text-primary-foreground">
                    {initials}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-black truncate">{freePlayer.fullName}</h2>
                <p className="text-base text-primary font-medium">
                  {POSITION_LABELS[freePlayer.primaryPosition]}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{freePlayer.age} años</span>
                  {freePlayer.city && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{freePlayer.city}{freePlayer.zone ? `, ${freePlayer.zone}` : ''}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats físicas */}
            <div className="grid grid-cols-3 gap-px bg-white/5 border-t border-white/5">
              <div className="bg-card/30 p-3 text-center">
                <Footprints className="h-4 w-4 mx-auto text-primary mb-1" />
                <p className="text-[10px] text-muted-foreground">Pie dominante</p>
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

        {/* Mejores marcas */}
        <Card className="border-white/5 bg-gradient-card">
          <CardContent className="p-5">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Rendimiento físico
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
        {freePlayer.testResults.length > 0 && (
          <Card className="border-white/5 bg-gradient-card">
            <CardContent className="p-5">
              <h3 className="font-bold text-sm mb-3">Tests realizados</h3>
              <div className="space-y-2">
                {freePlayer.testResults.map((test: any) => (
                  <div key={test.id} className="flex items-center justify-between p-2 rounded-lg bg-card/30">
                    <div>
                      <p className="text-sm font-medium">{TEST_LABELS[test.type] || test.type}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(test.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{test.value} {test.unit}</p>
                      {test.status === 'VERIFICADO' && (
                        <Badge variant="outline" className="text-[9px] bg-emerald-500/20 text-emerald-400">
                          ✓ Verificado
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botón compartir */}
        <Button onClick={handleShare} className="w-full bg-gradient-primary h-12" size="lg">
          <Share2 className="h-5 w-5 mr-2" />
          {copied ? '¡Link copiado!' : 'Compartir carta'}
        </Button>

        {/* CTA */}
        <div className="text-center text-xs text-muted-foreground">
          <p>¿Quieres tu propia carta?</p>
          <a href="/login" className="text-primary hover:underline font-medium">
            Crea tu perfil en Futapp →
          </a>
        </div>
      </main>
    </div>
  )
}
