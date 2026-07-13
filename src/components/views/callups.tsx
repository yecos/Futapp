'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ClipboardList, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'

interface MatchData {
  id: string
  title: string
  date: string
  opponent: string | null
  isHome: boolean | null
  status: string
  homeScore: number | null
  awayScore: number | null
  formation: string | null
}

interface PlayerData {
  id: string
  fullName: string
  jerseyNumber: number
  primaryPosition: string
  status: string
}

interface CallupData {
  id: string
  eventId: string
  playerId: string
  status: string
  positionLabel: string | null
  isCaptain: boolean
}

export function CallupsView({ matches, players }: { matches: MatchData[]; players: PlayerData[] }) {
  const now = new Date()
  const upcomingMatches = matches.filter(m => new Date(m.date) >= now && m.status === 'PROGRAMADO')
  const [selectedMatchId, setSelectedMatchId] = useState<string>(upcomingMatches[0]?.id || '')

  const selectedMatch = upcomingMatches.find(m => m.id === selectedMatchId)

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
          <h1 className="text-xl font-bold mt-2">Convocatorias</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-24">
        {upcomingMatches.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No hay partidos próximos para convocar.</p>
          </CardContent></Card>
        ) : (
          <>
            {/* Selector de partido */}
            <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
              {upcomingMatches.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatchId(m.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedMatchId === m.id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
                  }`}
                >
                  vs {m.opponent || m.title}
                </button>
              ))}
            </div>

            {/* Cancha */}
            {selectedMatch && (
              <Card className="border-primary/20 bg-gradient-card overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-[3/4] max-w-sm mx-auto bg-gradient-to-b from-emerald-600 to-emerald-800">
                    {/* Líneas de cancha */}
                    <div className="absolute inset-2 border-2 border-white/30 rounded-lg" />
                    <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-white/30" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 border-2 border-white/30 rounded-full" />
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1/2 h-16 border-2 border-t-0 border-white/30" />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-16 border-2 border-b-0 border-white/30" />

                    {/* Formación */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/40 text-white text-[10px] font-bold">
                      {selectedMatch.formation || '4-3-3'}
                    </div>

                    {/* Info del partido */}
                    <div className="absolute bottom-2 left-2 right-2 text-center text-white text-xs">
                      <p className="font-bold">{selectedMatch.title}</p>
                      <p className="text-white/80">{new Date(selectedMatch.date).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de jugadores disponibles */}
            <div className="mt-4">
              <h3 className="text-sm font-bold mb-2">Plantilla disponible ({players.filter(p => p.status === 'DISPONIBLE').length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {players.map((p, i) => (
                  <Card key={p.id} className="border-white/5 bg-card/50 animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                    <CardContent className="p-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                        {p.jerseyNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{p.fullName}</p>
                        <p className="text-[10px] text-muted-foreground">{p.primaryPosition}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
