'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface EventData {
  id: string
  type: string
  title: string
  description: string | null
  date: string
  location: string
  opponent: string | null
  isHome: boolean | null
  status: string
  homeScore: number | null
  awayScore: number | null
}

const TYPE_LABELS: Record<string, string> = {
  ENTRENAMIENTO: 'Entrenamiento',
  PARTIDO: 'Partido',
  TORNEO: 'Torneo',
  REUNION: 'Reunión',
  EVENTO: 'Evento',
}

const TYPE_COLORS: Record<string, string> = {
  ENTRENAMIENTO: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  PARTIDO: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  TORNEO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  REUNION: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  EVENTO: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
}

export function CalendarView({ events }: { events: EventData[] }) {
  const [tab, setTab] = useState<'proximos' | 'pasados'>('proximos')

  const now = new Date()
  const proximos = events.filter(e => new Date(e.date) >= now && e.status === 'PROGRAMADO')
  const pasados = events.filter(e => new Date(e.date) < now || e.status === 'COMPLETADO')

  const lista = tab === 'proximos' ? proximos : pasados

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
          <h1 className="text-xl font-bold mt-2">Calendario</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-24">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('proximos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'proximos' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
          >
            Próximos ({proximos.length})
          </button>
          <button
            onClick={() => setTab('pasados')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'pasados' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
          >
            Finalizados ({pasados.length})
          </button>
        </div>

        <div className="space-y-3">
          {lista.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No hay eventos {tab === 'proximos' ? 'próximos' : 'finalizados'}.</p>
            </CardContent></Card>
          )}

          {lista.map((event, i) => {
            const d = new Date(event.date)
            const isPast = event.status === 'COMPLETADO'
            return (
              <Card key={event.id} className="border-white/5 bg-gradient-card card-hover animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center justify-center w-14 shrink-0 rounded-lg bg-primary/15 py-2">
                      <span className="text-[10px] font-medium uppercase text-primary">
                        {d.toLocaleDateString('es-CO', { month: 'short' })}
                      </span>
                      <span className="text-xl font-extrabold text-primary">{d.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${TYPE_COLORS[event.type]}`}>
                          {TYPE_LABELS[event.type] || event.type}
                        </Badge>
                        {isPast && event.homeScore !== null && (
                          <Badge variant="secondary" className="text-[10px]">
                            {event.homeScore} - {event.awayScore}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm">{event.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
