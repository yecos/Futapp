'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, CheckCircle2, XCircle, MinusCircle, Send, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

const STATUS_INFO: Record<string, { label: string; icon: any; color: string }> = {
  PENDIENTE: { label: 'Pendiente', icon: Clock, color: 'bg-amber-500/20 text-amber-400' },
  ACEPTADA: { label: 'Aceptada', icon: CheckCircle2, color: 'bg-emerald-500/20 text-emerald-400' },
  RECHAZADA: { label: 'Rechazada', icon: XCircle, color: 'bg-rose-500/20 text-rose-400' },
  RETIRADA: { label: 'Retirada', icon: MinusCircle, color: 'bg-zinc-500/20 text-zinc-400' },
}

const POSITION_LABELS: Record<string, string> = {
  PORTERO: 'Portero',
  DEFENSA: 'Defensa',
  MEDIOCAMPISTA: 'Mediocampista',
  DELANTERO: 'Delantero',
}

interface Application {
  id: string
  status: string
  message: string | null
  teamResponse: string | null
  createdAt: string
  respondedAt: string | null
  contactShared: boolean
  opening: {
    id: string
    title: string
    position: string
    city: string | null
    zone: string | null
    team: {
      name: string
      shortName: string
      primaryColor: string
      category: string
    }
  }
}

export function MyApplicationsClient({ applications }: { applications: Application[] }) {
  const [withdrawing, setWithdrawing] = useState<string | null>(null)

  const handleWithdraw = async (id: string) => {
    if (!confirm('¿Retirar esta postulación?')) return
    setWithdrawing(id)
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw' }),
      })
      if (!res.ok) throw new Error('Error al retirar')
      toast.success('Postulación retirada')
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setWithdrawing(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <Link href="/marketplace" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Marketplace
          </Link>
          <h1 className="text-xl font-bold mt-2">Mis Postulaciones</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-24">
        {applications.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Send className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No has postulado a ningún cupo todavía.</p>
            <Link href="/marketplace" className="text-primary hover:underline text-sm mt-2 inline-block">
              Ver cupos disponibles →
            </Link>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app, i) => {
              const status = STATUS_INFO[app.status] || STATUS_INFO.PENDIENTE
              const Icon = status.icon
              return (
                <Card key={app.id} className="border-white/5 bg-gradient-card animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-xs shrink-0"
                        style={{ backgroundColor: app.opening.team.primaryColor }}
                      >
                        {app.opening.team.shortName.slice(0, 3)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                            <Icon className="h-2.5 w-2.5 mr-0.5" /> {status.label}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {POSITION_LABELS[app.opening.position]}
                          </Badge>
                        </div>

                        <h3 className="font-bold text-sm">{app.opening.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {app.opening.team.name} · {app.opening.team.category}
                        </p>

                        {app.opening.city && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {app.opening.city}{app.opening.zone ? `, ${app.opening.zone}` : ''}
                          </p>
                        )}

                        {/* Mensaje del jugador */}
                        {app.message && (
                          <p className="text-xs text-muted-foreground mt-2 italic p-2 rounded bg-card/30">
                            "{app.message}"
                          </p>
                        )}

                        {/* Respuesta del equipo */}
                        {app.teamResponse && (
                          <div className="mt-2 p-2 rounded bg-card/50 border border-white/5">
                            <p className="text-[10px] text-muted-foreground mb-1">Respuesta del equipo:</p>
                            <p className="text-xs">{app.teamResponse}</p>
                          </div>
                        )}

                        {/* Contacto compartido */}
                        {app.status === 'ACEPTADA' && app.contactShared && (
                          <div className="mt-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-xs text-emerald-400 font-medium mb-1">
                              ✅ ¡El equipo aceptó tu postulación!
                            </p>
                            <p className="text-xs text-muted-foreground">
                              El equipo tiene acceso a tu carta. Contacta al admin para coordinar.
                            </p>
                            <Link href={`/carta/${app.id}`} className="text-xs text-primary hover:underline mt-1 inline-block">
                              Ver mi carta pública →
                            </Link>
                          </div>
                        )}

                        {/* Fecha */}
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Postulaste el {new Date(app.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
                        </p>

                        {/* Acción */}
                        {app.status === 'PENDIENTE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                            onClick={() => handleWithdraw(app.id)}
                            disabled={withdrawing === app.id}
                          >
                            Retirar postulación
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
