'use client'

import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/app/sidebar'
import { MobileNav } from '@/components/app/mobile-nav'
import { DashboardView } from '@/components/views/dashboard'
import { CalendarView } from '@/components/views/calendar'
import { RosterView } from '@/components/views/roster'
import { CallupsView } from '@/components/views/callups'
import { ResultsView } from '@/components/views/results'
import { AnnouncementsView } from '@/components/views/announcements'
import { Header } from '@/components/app/header'
import { useEffect, useState } from 'react'

export default function Home() {
  const activeView = useAppStore((s) => s.activeView)
  // Evita parpadeo de hidratación con Zustand persist
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true)
  }, [])

  // En el servidor (SSR) o primer render del cliente, mostramos el spinner
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-3 h-12 w-12 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando Halcones FC…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-0">
        <Header />
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8 scroll-area">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
            {activeView === 'inicio' && <DashboardView />}
            {activeView === 'calendario' && <CalendarView />}
            {activeView === 'plantilla' && <RosterView />}
            {activeView === 'convocatorias' && <CallupsView />}
            {activeView === 'resultados' && <ResultsView />}
            {activeView === 'avisos' && <AnnouncementsView />}
          </div>
        </main>
      </div>

      {/* Nav móvil fijo abajo */}
      <MobileNav />
    </div>
  )
}
