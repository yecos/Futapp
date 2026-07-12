'use client'

import { useAppStore } from '@/lib/store'
import { Shield, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  inicio: { title: 'Inicio', subtitle: 'Panel del equipo' },
  calendario: { title: 'Calendario', subtitle: 'Entrenamientos, partidos y eventos' },
  plantilla: { title: 'Plantilla', subtitle: 'Jugadores y perfiles' },
  convocatorias: { title: 'Convocatorias', subtitle: 'Listas y alineaciones' },
  resultados: { title: 'Resultados', subtitle: 'Partidos y estadísticas' },
  avisos: { title: 'Avisos', subtitle: 'Anuncios del cuerpo técnico' },
}

export function Header() {
  const activeView = useAppStore((s) => s.activeView)
  const setActiveView = useAppStore((s) => s.setActiveView)
  const team = useAppStore((s) => s.team)
  const unreadAnnouncements = useAppStore((s) => {
    const player = s.players.find((p) => p.id === s.currentUserId)
    return s.announcements.filter(
      (a) => !player || !a.readBy.includes(player.id)
    ).length
  })
  const info = VIEW_TITLES[activeView] || VIEW_TITLES.inicio

  return (
    <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur px-8">
      <div>
        <h1 className="text-lg font-bold leading-tight">{info.title}</h1>
        <p className="text-xs text-muted-foreground">{info.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveView('avisos')}
          className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent transition-colors"
          aria-label="Avisos"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadAnnouncements > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1">
              {unreadAnnouncements}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Shield className="h-4.5 w-4.5" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium leading-tight">DT. {team.coachName}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Entrenador</p>
          </div>
        </div>
      </div>
    </header>
  )
}
