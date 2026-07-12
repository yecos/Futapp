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
  { id: 'convocatorias', label: 'Convocatorias', icon: ClipboardList },
  { id: 'resultados', label: 'Resultados', icon: Trophy },
  { id: 'avisos', label: 'Avisos', icon: Bell },
]

export function Sidebar() {
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
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-sidebar sticky top-0 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Shield className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-sm truncate">{team.name}</h2>
          <p className="text-[11px] text-muted-foreground truncate">{team.category}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'avisos' && unreadAnnouncements > 0 && (
                <span className={cn(
                  'flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold px-1.5',
                  isActive ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'
                )}>
                  {unreadAnnouncements}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t">
        <div className="text-[11px] text-muted-foreground">
          <p className="font-medium text-foreground">DT. {team.coachName}</p>
          <p className="mt-0.5">Fundado en {team.foundedYear}</p>
        </div>
      </div>
    </aside>
  )
}
