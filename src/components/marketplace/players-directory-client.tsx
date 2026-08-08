'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Search, Users, MapPin, Activity, Zap } from 'lucide-react'
import Link from 'next/link'

const POSITION_LABELS: Record<string, string> = {
  PORTERO: 'Portero', DEFENSA: 'Defensa', MEDIOCAMPISTA: 'Mediocampista', DELANTERO: 'Delantero',
}

const POSITION_COLORS: Record<string, string> = {
  PORTERO: 'bg-amber-500',
  DEFENSA: 'bg-sky-500',
  MEDIOCAMPISTA: 'bg-emerald-500',
  DELANTERO: 'bg-rose-500',
}

interface Player {
  id: string
  fullName: string
  age: number
  photoUrl: string | null
  primaryPosition: string
  city: string | null
  zone: string | null
  bestVerticalJumpCm: number | null
  bestSprint10Sec: number | null
  bestSprint20Sec: number | null
}

export function PlayersDirectoryClient({ players: initial }: { players: Player[] }) {
  const [search, setSearch] = useState('')
  const [positionFilter, setPositionFilter] = useState<string>('all')

  const filtered = initial.filter(p => {
    const matchesSearch = !search ||
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (p.city || '').toLowerCase().includes(search.toLowerCase())
    const matchesPosition = positionFilter === 'all' || p.primaryPosition === positionFilter
    return matchesSearch && matchesPosition
  })

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
          <h1 className="text-xl font-bold mt-2 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Jugadores Libres
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {initial.length} jugadores con carta pública
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-24">
        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o ciudad..."
              className="pl-9"
            />
          </div>
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="PORTERO">Porteros</SelectItem>
              <SelectItem value="DEFENSA">Defensas</SelectItem>
              <SelectItem value="MEDIOCAMPISTA">Mediocamp.</SelectItem>
              <SelectItem value="DELANTERO">Delanteros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid de jugadores */}
        {filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No se encontraron jugadores.</p>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((player, i) => (
              <Card
                key={player.id}
                className="border-white/5 bg-gradient-card card-hover animate-fade-in-up cursor-pointer"
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => window.open(`/carta/${player.id}`, '_blank')}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-xs ${POSITION_COLORS[player.primaryPosition]}`}>
                      {player.photoUrl ? (
                        <img src={player.photoUrl} alt={player.fullName} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        player.fullName[0]
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate">{player.fullName}</p>
                      <p className="text-[10px] text-muted-foreground">{player.age} años</p>
                    </div>
                  </div>

                  <Badge variant="outline" className={`text-[9px] mb-2 ${
                    player.primaryPosition === 'PORTERO' ? 'bg-amber-500/20 text-amber-400' :
                    player.primaryPosition === 'DEFENSA' ? 'bg-sky-500/20 text-sky-400' :
                    player.primaryPosition === 'MEDIOCAMPISTA' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {POSITION_LABELS[player.primaryPosition]}
                  </Badge>

                  {player.city && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin className="h-2.5 w-2.5" /> {player.city}{player.zone ? `, ${player.zone}` : ''}
                    </p>
                  )}

                  {/* Stats rápidas */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-center mt-2">
                    {player.bestVerticalJumpCm && (
                      <div className="p-1 rounded bg-amber-500/10">
                        <p className="text-muted-foreground">Salto</p>
                        <p className="font-bold text-amber-400">{player.bestVerticalJumpCm}cm</p>
                      </div>
                    )}
                    {player.bestSprint10Sec && (
                      <div className="p-1 rounded bg-sky-500/10">
                        <p className="text-muted-foreground">Sprint</p>
                        <p className="font-bold text-sky-400">{player.bestSprint10Sec.toFixed(2)}s</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
