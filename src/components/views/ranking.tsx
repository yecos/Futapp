'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { ArrowLeft, Flame, Crown, Star, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface PlayerRank {
  id: string
  fullName: string
  jerseyNumber: number
  primaryPosition: string
  photoUrl: string | null
  statPoints: number
  totalPointsEarned: number
  streak: number
  maxStreak: number
  basePAC: number
  baseSHO: number
  basePAS: number
  baseDRI: number
  baseDEF: number
  basePHY: number
}

function getLevel(totalPoints: number) {
  if (totalPoints >= 1000) return { name: 'Leyenda', icon: '👑', color: 'text-amber-400', bg: 'from-amber-900/40 to-yellow-900/20', border: 'border-amber-500/40' }
  if (totalPoints >= 501) return { name: 'Estrella', icon: '🌟', color: 'text-purple-400', bg: 'from-purple-900/40 to-fuchsia-900/20', border: 'border-purple-500/40' }
  if (totalPoints >= 301) return { name: 'Profesional', icon: '⭐', color: 'text-sky-400', bg: 'from-sky-900/40 to-blue-900/20', border: 'border-sky-500/40' }
  if (totalPoints >= 151) return { name: 'Semi-Pro', icon: '🥇', color: 'text-emerald-400', bg: 'from-emerald-900/40 to-green-900/20', border: 'border-emerald-500/40' }
  if (totalPoints >= 51) return { name: 'Amateur', icon: '🥈', color: 'text-zinc-300', bg: 'from-zinc-800/40 to-zinc-900/20', border: 'border-zinc-400/40' }
  return { name: 'Novato', icon: '🥉', color: 'text-orange-400', bg: 'from-orange-900/40 to-amber-900/20', border: 'border-orange-500/40' }
}

function calculateRating(p: PlayerRank): number {
  const weights = p.primaryPosition === 'PORTERO' ?
    { pac: 0.05, sho: 0.05, pas: 0.15, dri: 0.10, def: 0.40, phy: 0.25 } :
    p.primaryPosition === 'DEFENSA' ?
    { pac: 0.15, sho: 0.05, pas: 0.15, dri: 0.10, def: 0.35, phy: 0.20 } :
    p.primaryPosition === 'MEDIOCAMPISTA' ?
    { pac: 0.15, sho: 0.15, pas: 0.25, dri: 0.20, def: 0.10, phy: 0.15 } :
    { pac: 0.25, sho: 0.30, pas: 0.15, dri: 0.20, def: 0.05, phy: 0.05 }

  return Math.round(
    p.basePAC * weights.pac + p.baseSHO * weights.sho + p.basePAS * weights.pas +
    p.baseDRI * weights.dri + p.baseDEF * weights.def + p.basePHY * weights.phy
  )
}

const POSITION_SHORT: Record<string, string> = {
  PORTERO: 'POR', DEFENSA: 'DEF', MEDIOCAMPISTA: 'MED', DELANTERO: 'DEL',
}

export function RankingView({ players }: { players: PlayerRank[] }) {
  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
          <h1 className="text-xl font-bold mt-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-400" /> Ranking
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-24">
        <div className="space-y-2">
          {players.map((p, i) => {
            const level = getLevel(p.totalPointsEarned || 0)
            const rating = calculateRating(p)
            const initials = p.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)

            return (
              <Card
                key={p.id}
                className={`border-white/5 bg-gradient-to-br ${level.bg} ${level.border} animate-fade-in-up card-hover`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  {/* Posición en ranking */}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm shrink-0 ${
                    i === 0 ? 'bg-amber-500 text-amber-900' :
                    i === 1 ? 'bg-zinc-400 text-zinc-900' :
                    i === 2 ? 'bg-amber-700 text-amber-100' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </div>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.fullName} className="h-12 w-12 rounded-full object-cover border-2 border-white/20" />
                    ) : (
                      <div className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-black bg-gradient-to-br from-primary/40 to-primary/10 border-2 border-white/20 text-primary-foreground">
                        {initials}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border border-white/20 flex items-center justify-center text-[9px] font-bold">
                      {p.jerseyNumber}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate">{p.fullName}</p>
                      <span className="text-[10px] text-muted-foreground">{POSITION_SHORT[p.primaryPosition]}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={`text-[9px] ${level.color}`}>
                        {level.icon} {level.name}
                      </Badge>
                      {p.streak > 0 && (
                        <Badge variant="outline" className="text-[9px] text-orange-400 border-orange-500/30">
                          <Flame className="h-2.5 w-2.5 mr-0.5" /> {p.streak}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Rating + Puntos */}
                  <div className="text-right shrink-0">
                    <p className={`text-2xl font-black ${level.color}`}>
                      <AnimatedCounter value={p.totalPointsEarned || 0} />
                    </p>
                    <p className="text-[9px] text-muted-foreground">pts · RAT {rating}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {players.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No hay jugadores en el ranking aún.</p>
          </CardContent></Card>
        )}

        {/* Leyenda de niveles */}
        <div className="mt-6 p-4 rounded-xl glass border border-white/5">
          <h3 className="text-sm font-bold mb-3">Niveles</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1"><span>🥉</span> Novato <span className="text-muted-foreground">0-50</span></div>
            <div className="flex items-center gap-1"><span>🥈</span> Amateur <span className="text-muted-foreground">51-150</span></div>
            <div className="flex items-center gap-1"><span>🥇</span> Semi-Pro <span className="text-muted-foreground">151-300</span></div>
            <div className="flex items-center gap-1"><span>⭐</span> Profesional <span className="text-muted-foreground">301-500</span></div>
            <div className="flex items-center gap-1"><span>🌟</span> Estrella <span className="text-muted-foreground">501-999</span></div>
            <div className="flex items-center gap-1"><span>👑</span> Leyenda <span className="text-muted-foreground">1000+</span></div>
          </div>
        </div>
      </main>
    </div>
  )
}
