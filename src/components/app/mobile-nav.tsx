'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Home, Calendar, Users, ClipboardList, Trophy, Bell, Shield,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'calendario', label: 'Calendario', icon: Calendar },
  { id: 'plantilla', label: 'Plantilla', icon: Users },
  { id: 'convocatorias', label: 'Convocatoria', icon: ClipboardList },
  { id: 'resultados', label: 'Resultados', icon: Trophy },
  { id: 'avisos', label: 'Avisos', icon: Bell },
]

export function MobileNav() {
  const activeView = useAppStore((s) => s.activeView)
  const setActiveView = useAppStore((s) => s.setActiveView)
  const team = useAppStore((s) => s.team)
  const unreadAnnouncements = useAppStore((s) => {
    const player = s.players.find((p) => p.id === s.currentUserId)
    return s.announcements.filter(
      (a) => !player || !a.readBy.includes(player.id)
    ).length
  })

  return (
    <>
      {/* Top bar móvil */}
      <header className="lg:hidden sticky top-0 z-30 bg-primary text-primary-foreground px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/15">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-sm leading-tight truncate">{team.name}</h1>
            <p className="text-[10px] text-primary-foreground/80 truncate">{team.category}</p>
          </div>
        </div>
      </header>

      {/* Bottom nav móvil */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t shadow-lg">
        <div className="grid grid-cols-6">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <div className="relative">
                  <Icon className={cn('h-5 w-5', isActive && 'scale-110')} />
                  {item.id === 'avisos' && unreadAnnouncements > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1">
                      {unreadAnnouncements}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium leading-none">{item.label}</span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
