'use client'

import { Player } from '@/lib/types'
import { getFormationLayout } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import { Crown } from 'lucide-react'

interface FootballFieldProps {
  formation: string
  startingPlayers: Player[]
  positions: Record<string, string> // playerId -> position label
  captainId?: string
  onPlayerClick?: (player: Player) => void
}

export function FootballField({
  formation, startingPlayers, positions, captainId, onPlayerClick,
}: FootballFieldProps) {
  const layout = getFormationLayout(formation)
  // Mapear posiciones a jugadores: si positions[playerId] = 'POR', entonces ese jugador va a la posición 'POR'
  // Pero necesitamos el reverso: dado un label, qué jugador está ahí
  const positionToPlayer: Record<string, Player> = {}
  startingPlayers.forEach((p) => {
    const label = positions[p.id]
    if (label) positionToPlayer[label] = p
  })

  return (
    <div className="relative w-full aspect-[3/4] max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg bg-gradient-to-b from-emerald-500 to-emerald-700">
      {/* Líneas de cancha */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Bordes */}
        <div className="absolute inset-2 border-2 border-white/40 rounded-lg" />
        {/* Línea media */}
        <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-white/40" />
        {/* Círculo central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 border-2 border-white/40 rounded-full" />
        {/* Área grande arriba (nuestra portería) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1/2 h-16 border-2 border-t-0 border-white/40" />
        {/* Área pequeña arriba */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1/3 h-7 border-2 border-t-0 border-white/40" />
        {/* Área grande abajo (delantera) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-16 border-2 border-b-0 border-white/40" />
        {/* Área pequeña abajo */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-7 border-2 border-b-0 border-white/40" />
        {/* Patrón de franjas */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 30px, transparent 30px, transparent 60px)',
        }} />
      </div>

      {/* Jugadores */}
      {layout.map((pos, idx) => {
        const player = positionToPlayer[pos.label]
        if (!player) {
          // Posición vacía
          return (
            <div
              key={idx}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-dashed border-white/50 bg-white/5 flex items-center justify-center text-white/50 text-[10px] font-medium">
                {pos.label}
              </div>
            </div>
          )
        }
        return (
          <button
            key={idx}
            onClick={() => onPlayerClick?.(player)}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-emerald-700 font-bold text-sm group-hover:scale-110 transition-transform ring-2 ring-white">
                {player.jerseyNumber}
              </div>
              {captainId === player.id && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-amber-900">
                  <Crown className="h-2.5 w-2.5" />
                </span>
              )}
            </div>
            <span className="mt-1 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm text-white text-[9px] font-medium whitespace-nowrap max-w-[60px] truncate">
              {player.name.split(' ')[0]}
            </span>
          </button>
        )
      })}

      {/* Etiqueta de formación */}
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold">
        {formation}
      </div>
    </div>
  )
}
