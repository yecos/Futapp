'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsWidget } from '@/components/ui/stats-widget'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import {
  Calendar, Users, ClipboardList, Trophy, Bell, CreditCard,
  Settings, Shield, LogOut, TrendingUp, Goal, ArrowRight, Sparkles,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface DashboardViewProps {
  teamName: string
  teamShortName: string
}

interface DashboardData {
  totalPlayers: number
  totalEvents: number
  totalPayments: number
  totalRecaudado: number
  nextEvent?: {
    title: string
    date: string
    location: string
    type: string
  }
  topScorer?: {
    name: string
    goals: number
    jerseyNumber: number
  }
  recentResults: Array<{
    title: string
    homeScore: number
    awayScore: number
    isWin: boolean
    isDraw: boolean
  }>
}

export function DashboardView({ teamName, teamShortName }: DashboardViewProps) {
  const { data: session, status } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch (e) {
      console.error('Error fetching dashboard:', e)
    }
  }

  // Esperar a que el componente esté montado para evitar hidratación
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-deportivo">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  const userName = session?.user?.name || 'Usuario'
  const userRole = session?.user?.role || 'SEGUIDOR'
  const isAdmin = userRole === 'ADMIN'

  const menuItems = [
    { href: '/calendario', icon: Calendar, label: 'Calendario', desc: 'Entrenamientos y partidos', iconBg: 'bg-sky-500/20 text-sky-400' },
    { href: '/plantilla', icon: Users, label: 'Plantilla', desc: 'Jugadores y perfiles', iconBg: 'bg-emerald-500/20 text-emerald-400' },
    { href: '/convocatorias', icon: ClipboardList, label: 'Convocatorias', desc: 'Alineaciones tácticas', iconBg: 'bg-violet-500/20 text-violet-400' },
    { href: '/resultados', icon: Trophy, label: 'Resultados', desc: 'Partidos y estadísticas', iconBg: 'bg-amber-500/20 text-amber-400' },
    { href: '/avisos', icon: Bell, label: 'Avisos', desc: 'Anuncios del equipo', iconBg: 'bg-rose-500/20 text-rose-400' },
    { href: '/pagos', icon: CreditCard, label: 'Mis Pagos', desc: 'Mensualidades y cobros', iconBg: 'bg-teal-500/20 text-teal-400' },
  ]

  if (isAdmin) {
    menuItems.push(
      { href: '/admin/equipo', icon: Settings, label: 'Configuración', desc: 'Datos del equipo', iconBg: 'bg-zinc-500/20 text-zinc-300' },
      { href: '/admin/pagos', icon: CreditCard, label: 'Gestión Pagos', desc: 'Crear y verificar', iconBg: 'bg-green-500/20 text-green-400' },
      { href: '/admin/miembros', icon: Users, label: 'Miembros', desc: 'Invitar y aprobar', iconBg: 'bg-indigo-500/20 text-indigo-400' },
    )
  }

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-lg">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">{teamName}</h1>
                <p className="text-[11px] text-muted-foreground">{teamShortName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm font-medium">{userName.split(' ')[0]}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-card/50 border border-white/5 hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 pb-32 lg:pb-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            ¡Hola, {userName.split(' ')[0]}! 👋
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatsWidget icon={Users} label="Jugadores" value={data?.totalPlayers || 0} variant="primary" index={0} />
          <StatsWidget icon={Calendar} label="Eventos" value={data?.totalEvents || 0} variant="info" index={1} />
          <StatsWidget icon={TrendingUp} label="Recaudado" value={data?.totalRecaudado || 0} prefix="$" variant="success" index={2} />
          <StatsWidget icon={CreditCard} label="Pagos pend." value={data?.totalPayments || 0} variant="warning" index={3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-primary/20 bg-gradient-card">
              <CardContent className="p-0">
                <div className="relative p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Próximo evento</span>
                  </div>
                  {data?.nextEvent ? (
                    <>
                      <h3 className="text-xl sm:text-2xl font-bold mb-2">{data.nextEvent.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>{new Date(data.nextEvent.date).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        <span>{data.nextEvent.location}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">No hay eventos próximos</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-950/30 to-yellow-950/20">
            <CardContent className="p-5 text-center">
              <Trophy className="h-5 w-5 text-amber-400 mx-auto mb-2" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Top Goleador</span>
              {data?.topScorer ? (
                <div className="mt-3">
                  <p className="font-bold text-sm">{data.topScorer.name}</p>
                  <p className="text-2xl font-black text-amber-400 mt-1">
                    <AnimatedCounter value={data.topScorer.goals} /> goles
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-3">Sin datos</p>
              )}
            </CardContent>
          </Card>
        </div>

        <h3 className="text-lg font-bold mb-4">Acceso rápido</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {menuItems.map((item, i) => {
            const Icon = item.icon
            return (
              <Link key={item.label} href={item.href}>
                <Card className="border-white/5 bg-card/50 hover:border-primary/30 hover:bg-card transition-all cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${item.iconBg}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-sm">{item.label}</h4>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
