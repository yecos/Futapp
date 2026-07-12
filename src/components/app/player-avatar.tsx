'use client'

import { Player } from '@/lib/types'
import { initials, positionColor, statusBadgeClass, statusLabel } from '@/lib/helpers'
import { cn } from '@/lib/utils'

interface PlayerAvatarProps {
  player: Player
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showNumber?: boolean
  showStatus?: boolean
  className?: string
}

const SIZES: Record<NonNullable<PlayerAvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
}

export function PlayerAvatar({
  player, size = 'md', showNumber = false, showStatus = false, className,
}: PlayerAvatarProps) {
  const pos = player.primaryPosition
  return (
    <div className={cn('relative inline-flex', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full font-bold text-white ring-2 ring-background',
          SIZES[size],
          positionColor(pos)
        )}
      >
        {initials(player.name)}
        {showNumber && (
          <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-background text-foreground text-[10px] font-bold px-1 border shadow-sm">
            {player.jerseyNumber}
          </span>
        )}
      </div>
      {showStatus && player.status !== 'disponible' && (
        <span
          className={cn(
            'absolute -top-1 -left-1 flex items-center justify-center rounded-full h-3 w-3 ring-2 ring-background',
            statusBadgeClass(player.status)
          )}
          title={statusLabel(player.status)}
        />
      )}
    </div>
  )
}
