'use client'

import { Player } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Crown, Star } from 'lucide-react'
import { useState } from 'react'

interface PlayerCardFUTProps {
  player: {
    id: string
    fullName: string
    firstName?: string
    lastName?: string
    jerseyNumber: number
    primaryPosition: string
    secondaryPosition?: string | null
    age?: number
    dominantFoot?: string
    status?: string
    matchesPlayed?: number
    goals?: number
    assists?: number
    yellowCards?: number
    redCards?: number
    photoUrl?: string | null
    height?: number | null
    weight?: number | null
  }
  variant?: 'gold' | 'silver' | 'bronze' | 'icon' | 'hero'
  onClick?: () => void
  className?: string
  index?: number
}

// Stats estilo FUT (calculadas desde los datos reales)
function calculateFUTStats(player: PlayerCardFUTProps['player']) {
  const goals = player.goals || 0
  const assists = player.assists || 0
  const matches = player.matchesPlayed || 1

  // PAC (Pace) - basado en edad y posición
  const basePace = 85 - Math.max(0, (player.age || 25) - 20)
  const pac = Math.min(99, Math.max(40, basePace + (goals * 2)))

  // SHO (Shooting) - basado en goles
  const sho = Math.min(99, Math.max(40, 60 + (goals * 4)))

  // PAS (Passing) - basado en asistencias
  const pas = Math.min(99, Math.max(40, 60 + (assists * 5)))

  // DRI (Dribbling) - basado en posición
  const posBonus = player.primaryPosition === 'DELANTERO' ? 8 :
                   player.primaryPosition === 'MEDIOCAMPISTA' ? 5 : 2
  const dri = Math.min(99, Math.max(40, 65 + posBonus))

  // DEF (Defending) - basado en posición
  const defBonus = player.primaryPosition === 'DEFENSA' ? 25 :
                   player.primaryPosition === 'PORTERO' ? 20 :
                   player.primaryPosition === 'MEDIOCAMPISTA' ? 10 : 5
  const def = Math.min(99, Math.max(40, 50 + defBonus))

  // PHY (Physical) - basado en peso y altura
  const phy = Math.min(99, Math.max(40, 60 + Math.floor((player.weight || 70) / 4)))

  // Rating general (promedio ponderado por posición)
  const weights = player.primaryPosition === 'PORTERO' ?
    { pac: 0.05, sho: 0.05, pas: 0.15, dri: 0.10, def: 0.40, phy: 0.25 } :
    player.primaryPosition === 'DEFENSA' ?
    { pac: 0.15, sho: 0.05, pas: 0.15, dri: 0.10, def: 0.35, phy: 0.20 } :
    player.primaryPosition === 'MEDIOCAMPISTA' ?
    { pac: 0.15, sho: 0.15, pas: 0.25, dri: 0.20, def: 0.10, phy: 0.15 } :
    { pac: 0.25, sho: 0.30, pas: 0.15, dri: 0.20, def: 0.05, phy: 0.05 }

  const rating = Math.round(
    pac * weights.pac + sho * weights.sho + pas * weights.pas +
    dri * weights.dri + def * weights.def + phy * weights.phy
  )

  return { pac, sho, pas, dri, def, phy, rating }
}

const POSITION_SHORT: Record<string, string> = {
  PORTERO: 'POR',
  DEFENSA: 'DEF',
  MEDIOCAMPISTA: 'MED',
  DELANTERO: 'DEL',
}

const VARIANT_STYLES = {
  gold: {
    card: 'bg-gradient-to-br from-amber-900/40 via-amber-800/20 to-yellow-900/30 border-amber-500/40',
    header: 'text-amber-300',
    glow: 'shadow-[0_0_25px_rgba(251,191,36,0.25)]',
    accent: 'text-amber-400',
  },
  silver: {
    card: 'bg-gradient-to-br from-slate-700/40 via-slate-600/20 to-slate-800/30 border-slate-400/40',
    header: 'text-slate-200',
    glow: 'shadow-[0_0_20px_rgba(148,163,184,0.2)]',
    accent: 'text-slate-300',
  },
  bronze: {
    card: 'bg-gradient-to-br from-orange-900/40 via-orange-800/20 to-amber-900/30 border-orange-600/40',
    header: 'text-orange-300',
    glow: 'shadow-[0_0_20px_rgba(234,88,12,0.2)]',
    accent: 'text-orange-400',
  },
  icon: {
    card: 'bg-gradient-to-br from-violet-900/40 via-fuchsia-800/20 to-purple-900/30 border-fuchsia-500/40',
    header: 'text-fuchsia-300',
    glow: 'shadow-[0_0_30px_rgba(217,70,239,0.3)]',
    accent: 'text-fuchsia-400',
  },
  hero: {
    card: 'bg-gradient-to-br from-emerald-900/40 via-emerald-800/20 to-teal-900/30 border-emerald-500/40',
    header: 'text-emerald-300',
    glow: 'shadow-[0_0_25px_rgba(16,185,129,0.25)]',
    accent: 'text-emerald-400',
  },
}

export function PlayerCardFUT({
  player,
  variant = 'gold',
  onClick,
  className,
  index = 0,
}: PlayerCardFUTProps) {
  const [imageError, setImageError] = useState(false)
  const stats = calculateFUTStats(player)
  const styles = VARIANT_STYLES[variant]
  const posShort = POSITION_SHORT[player.primaryPosition] || 'MED'
  const initials = (player.firstName?.[0] || '') + (player.lastName?.[0] || player.fullName[0] || '')

  // Determinar variante automáticamente según rating
  const autoVariant = stats.rating >= 85 ? 'gold' : stats.rating >= 75 ? 'silver' : 'bronze'
  const finalVariant = variant === 'gold' && stats.rating < 75 ? autoVariant as keyof typeof VARIANT_STYLES : variant
  const finalStyles = VARIANT_STYLES[finalVariant]

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative group cursor-pointer transition-all duration-300',
        'hover:scale-105 hover:-translate-y-1',
        'animate-scale-in',
        finalStyles.glow,
        className
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={cn(
        'relative rounded-2xl border overflow-hidden p-4',
        'bg-gradient-to-br backdrop-blur-sm',
        finalStyles.card
      )}>
        {/* Efecto de brillo diagonal en hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Header: Rating + Posición + Foto */}
        <div className="relative flex flex-col items-center mb-3">
          {/* Rating y posición */}
          <div className="flex items-start justify-between w-full mb-2">
            <div className="flex flex-col items-center">
              <span className={cn('text-3xl font-black tabular-nums leading-none', finalStyles.header)}>
                {stats.rating}
              </span>
              <span className={cn('text-xs font-bold mt-0.5', finalStyles.header)}>
                {posShort}
              </span>
            </div>

            {/* Estado del jugador */}
            {player.status && player.status !== 'DISPONIBLE' && (
              <div className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-bold',
                player.status === 'LESIONADO' && 'bg-red-500/20 text-red-300 border border-red-500/30',
                player.status === 'SUSPENDIDO' && 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
                player.status === 'AUSENTE' && 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30',
              )}>
                {player.status === 'LESIONADO' ? '🩹' : player.status === 'SUSPENDIDO' ? '⚠️' : '🚫'}
              </div>
            )}
          </div>

          {/* Foto del jugador o iniciales */}
          <div className="relative">
            {player.photoUrl && !imageError ? (
              <img
                src={player.photoUrl}
                alt={player.fullName}
                onError={() => setImageError(true)}
                className="h-20 w-20 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div className={cn(
                'h-20 w-20 rounded-full flex items-center justify-center text-2xl font-black',
                'bg-gradient-to-br from-primary/40 to-primary/10 border-2 border-white/20',
                'text-primary-foreground'
              )}>
                {initials}
              </div>
            )}
            {/* Dorsal */}
            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background border-2 border-primary flex items-center justify-center">
              <span className="text-xs font-black text-primary">{player.jerseyNumber}</span>
            </div>
          </div>

          {/* Nombre */}
          <h3 className="mt-3 font-bold text-sm text-center text-foreground truncate max-w-full">
            {player.fullName}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {player.age} años · {player.dominantFoot || 'Diestro'}
          </p>
        </div>

        {/* Stats FUT */}
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          <StatBlock label="PAC" value={stats.pac} />
          <StatBlock label="SHO" value={stats.sho} />
          <StatBlock label="PAS" value={stats.pas} />
          <StatBlock label="DRI" value={stats.dri} />
          <StatBlock label="DEF" value={stats.def} />
          <StatBlock label="PHY" value={stats.phy} />
        </div>

        {/* Stats reales en footer */}
        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Partidos</p>
            <p className="font-bold text-sm text-foreground">{player.matchesPlayed || 0}</p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Goles</p>
            <p className="font-bold text-sm text-emerald-400">{player.goals || 0}</p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Asist.</p>
            <p className="font-bold text-sm text-sky-400">{player.assists || 0}</p>
          </div>
        </div>

        {/* Capitán badge */}
        {variant === 'icon' && (
          <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
            <Crown className="h-4 w-4 text-amber-900" />
          </div>
        )}
      </div>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: number }) {
  const colorClass = value >= 85 ? 'text-emerald-400' :
                     value >= 70 ? 'text-amber-300' :
                     'text-orange-400'
  return (
    <div className="flex items-center gap-1.5 bg-black/20 rounded px-1.5 py-1">
      <span className="font-bold tabular-nums text-sm" style={{ color: 'inherit' }}>
        <span className={colorClass}>{value}</span>
      </span>
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </div>
  )
}
