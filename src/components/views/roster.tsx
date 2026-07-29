'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AddPlayerDialog } from '@/components/players/add-player-dialog'

interface PlayerData {
  id: string
  fullName: string
  jerseyNumber: number
  primaryPosition: string
  secondaryPosition: string | null
  age: number
  dominantFoot: string
  height: number | null
  weight: number | null
  status: string
  matchesPlayed: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
}

const STATUS_LABELS: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  LESIONADO: 'Lesionado',
  SUSPENDIDO: 'Suspendido',
  AUSENTE: 'Ausente',
}

const STATUS_COLORS: Record<string, string> = {
  DISPONIBLE: 'bg-emerald-500/20 text-emerald-400',
  LESIONADO: 'bg-red-500/20 text-red-400',
  SUSPENDIDO: 'bg-amber-500/20 text-amber-400',
  AUSENTE: 'bg-zinc-500/20 text-zinc-400',
}

const POS_COLORS: Record<string, string> = {
  PORTERO: 'bg-amber-500',
  DEFENSA: 'bg-sky-500',
  MEDIOCAMPISTA: 'bg-emerald-500',
  DELANTERO: 'bg-rose-500',
}

export function RosterView({ players }: { players: PlayerData[] }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const canManage = ['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(session?.user?.role || '')

  const filtered = useMemo(() => {
    return players.filter(p =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      String(p.jerseyNumber).includes(search)
    )
  }, [players, search])

  const topScorer = [...players].sort((a, b) => b.goals - a.goals)[0]
  const topAssister = [...players].sort((a, b) => b.assists - a.assists)[0]
  const mostPlayed = [...players].sort((a, b) => b.matchesPlayed - a.matchesPlayed)[0]

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-xl font-bold">Plantilla</h1>
            {canManage && (
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar jugador
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-24">
        {/* Top stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {topScorer && (
            <Card className="border-amber-500/20 bg-gradient-to-br from-amber-950/30 to-yellow-950/10">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Goleador</p>
                <p className="text-sm font-bold truncate">{topScorer.fullName.split(' ')[0]}</p>
                <p className="text-lg font-black text-amber-400">{topScorer.goals}</p>
              </CardContent>
            </Card>
          )}
          {topAssister && (
            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-green-950/10">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Asistidor</p>
                <p className="text-sm font-bold truncate">{topAssister.fullName.split(' ')[0]}</p>
                <p className="text-lg font-black text-emerald-400">{topAssister.assists}</p>
              </CardContent>
            </Card>
          )}
          {mostPlayed && (
            <Card className="border-sky-500/20 bg-gradient-to-br from-sky-950/30 to-blue-950/10">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Más partidos</p>
                <p className="text-sm font-bold truncate">{mostPlayed.fullName.split(' ')[0]}</p>
                <p className="text-lg font-black text-sky-400">{mostPlayed.matchesPlayed}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar jugador..."
            className="pl-9"
          />
        </div>

        {/* Grid de jugadores */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((player, i) => (
            <Card key={player.id} onClick={() => router.push(`/plantilla/${player.id}`)} className="border-white/5 bg-gradient-card card-hover animate-fade-in-up cursor-pointer" style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm ${POS_COLORS[player.primaryPosition]}`}>
                    {player.jerseyNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate">{player.fullName}</p>
                    <p className="text-[10px] text-muted-foreground">{player.primaryPosition}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[9px] ${STATUS_COLORS[player.status]}`}>
                  {STATUS_LABELS[player.status]}
                </Badge>
                <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px]">
                  <div><p className="text-muted-foreground">PJ</p><p className="font-bold">{player.matchesPlayed}</p></div>
                  <div><p className="text-muted-foreground">G</p><p className="font-bold text-rose-400">{player.goals}</p></div>
                  <div><p className="text-muted-foreground">A</p><p className="font-bold text-emerald-400">{player.assists}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No se encontraron jugadores.</p>
            {canManage && (
              <Button size="sm" className="mt-3" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4 mr-1" /> Agregar jugador
              </Button>
            )}
          </CardContent></Card>
        )}
      </main>

      <AddPlayerDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={() => router.refresh()}
      />
    </div>
  )
}
