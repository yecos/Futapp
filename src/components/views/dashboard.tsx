'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsWidget } from '@/components/ui/stats-widget'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import {
  Calendar, Users, ClipboardList, Trophy, Bell, CreditCard,
  Settings, Shield, LogOut, TrendingUp, Goal, Hand, Target,
  DollarSign, Clock, ArrowRight, Sparkles,
} from 'lucide-react'
import { ROLE_LABELS, ROLE_ICONS } from '@/lib/permissions'
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
  const { data: session } = useSession()
  const role = session?.user?.role as any || 'SEGUIDOR'
  const isAdmin = role === 'ADMIN'
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
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

  const menuItems = [
    { href: '/calendario', icon: Calendar, label: 'Calendario', desc: 'Entrenamientos y partidos', color: 'from-sky-500/20 to-sky-700/10', iconBg: 'bg-sky-500/20 text-sky-400' },
    { href: '/plantilla', icon: Users, label: 'Plantilla', desc: 'Jugadores y perfiles', color: 'from-emerald-500/20 to-emerald-700/10', iconBg: 'bg-emerald-500/20 text-emerald-400' },
    { href: '/convocatorias', icon: ClipboardList, label: 'Convocatorias', desc: 'Alineaciones tácticas', color: 'from-violet-500/20 to-violet-700/10', iconBg: 'bg-violet-500/20 text-violet-400' },
    { href: '/resultados', icon: Trophy, label: 'Resultados', desc: 'Partidos y estadísticas', color: 'from-amber-500/20 to-amber-700/10', iconBg: 'bg-amber-500/20 text-amber-400' },
    { href: '/avisos', icon: Bell, label: 'Avisos', desc: 'Anuncios del equipo', color: 'from-rose-500/20 to-rose-700/10', iconBg: 'bg-rose-500/20 text-rose-400' },
    { href: '/pagos', icon: CreditCard, label: 'Mis Pagos', desc: 'Mensualidades y cobros', color: 'from-teal-500/20 to-teal-700/10', iconBg: 'bg-teal-500/20 text-teal-400' },
  ]

  if (isAdmin) {
    menuItems.push(
      { href: '/admin/equipo', icon: Settings, label: 'Configuración', desc: 'Datos del equipo', color: 'from-zinc-500/20 to-zinc-700/10', iconBg: 'bg-zinc-500/20 text-zinc-300' },
      { href: '/admin/pagos', icon: DollarSign, label: 'Gestión Pagos', desc: 'Crear y verificar', color: 'from-green-500/20 to-green-700/10', iconBg: 'bg-green-500/20 text-green-400' },
      { href: '/admin/miembros', icon: Users, label: 'Miembros', desc: 'Invitar y aprobar', color: 'from-indigo-500/20 to-indigo-700/10', iconBg: 'bg-indigo-500/20 text-indigo-400' },
    )
  }

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      {/* Header con gradiente y glassmorphism */}
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-lg glow-primary">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background pulse-ring" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight text-gradient-primary">{teamName}</h1>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {teamShortName} · Activo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50 border border-white/5">
                <span className="text-sm font-medium">{session?.user?.name?.split(' ')[0]}</span>
                <span className="text-xs text-muted-foreground">
                  {ROLE_ICONS[role]} {ROLE_LABELS[role]}
                </span>
              </div>
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
        {/* Hero greeting */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            ¡Hola, <span className="text-gradient-primary">{session?.user?.name?.split(' ')[0]}</span>! 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenido al panel de control de tu equipo.
          </p>
        </div>

        {/* Stats Widgets animados */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatsWidget
            icon={Users}
            label="Jugadores"
            value={data?.totalPlayers || 0}
            variant="primary"
            index={0}
          />
          <StatsWidget
            icon={Calendar}
            label="Eventos"
            value={data?.totalEvents || 0}
            variant="info"
            index={1}
          />
          <StatsWidget
            icon={TrendingUp}
            label="Recaudado"
            value={data?.totalRecaudado || 0}
            prefix="$"
            variant="success"
            index={2}
          />
          <StatsWidget
            icon={CreditCard}
            label="Pagos pendientes"
            value={data?.totalPayments || 0}
            variant="warning"
            index={3}
          />
        </div>

        {/* Próximo evento destacado + Top goleador */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Próximo evento - card grande */}
          <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <Card className="overflow-hidden border-primary/20 bg-gradient-card card-hover">
              <CardContent className="p-0">
                <div className="relative">
                  {/* Pattern de cancha */}
                  <div className="absolute inset-0 field-pattern opacity-30" />
                  <div className="relative p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Próximo evento
                      </span>
                    </div>
                    {data?.nextEvent ? (
                      <>
                        <h3 className="text-xl sm:text-2xl font-bold mb-2">{data.nextEvent.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(data.nextEvent.date).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3.5 w-3.5" />
                            {data.nextEvent.location}
                          </span>
                        </div>
                        <Button className="mt-4" size="sm">
                          Ver detalles
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No hay eventos próximos</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top goleador */}
          <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <Card className="border-amber-500/20 bg-gradient-to-br from-amber-950/30 to-yellow-950/20 card-hover h-full">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                    <Trophy className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Top Goleador
                  </span>
                </div>
                {data?.topScorer ? (
                  <div className="text-center">
                    <div className="relative inline-block mb-3">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-600/20 border-2 border-amber-500/40 flex items-center justify-center">
                        <span className="text-2xl font-black text-amber-300">
                          {data.topScorer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-amber-500 border-2 border-card flex items-center justify-center">
                        <span className="text-xs font-black text-amber-900">{data.topScorer.jerseyNumber}</span>
                      </div>
                    </div>
                    <p className="font-bold text-sm">{data.topScorer.name}</p>
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <Goal className="h-4 w-4 text-amber-400" />
                      <span className="text-2xl font-black text-amber-400">
                        <AnimatedCounter value={data.topScorer.goals} />
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">goles</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Trophy className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Sin datos aún</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Grid de menú */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-primary" />
            Acceso rápido
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {menuItems.map((item, i) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group animate-fade-in-up"
                  style={{ animationDelay: `${600 + i * 60}ms` }}
                >
                  <Card className={cn(
                    'overflow-hidden border-white/5 card-hover h-full bg-gradient-to-br',
                    item.color
                  )}>
                    <CardContent className="p-4">
                      <div className={cn(
                        'inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3',
                        'transition-transform group-hover:scale-110',
                        item.iconBg
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-sm mb-0.5">{item.label}</h4>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Resultados recientes */}
        {data?.recentResults && data.recentResults.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '1000ms' }}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary" />
              Últimos resultados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.recentResults.map((result, i) => (
                <Card key={i} className="border-white/5 bg-gradient-card card-hover">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg font-black text-sm',
                      result.isWin ? 'bg-emerald-500/20 text-emerald-400' :
                      result.isDraw ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    )}>
                      {result.isWin ? 'G' : result.isDraw ? 'E' : 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {result.homeScore} - {result.awayScore}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CTA de configuración para admin */}
        {isAdmin && (
          <Card className="mt-6 border-amber-500/30 bg-gradient-to-r from-amber-950/40 to-yellow-950/20 animate-fade-in-up" style={{ animationDelay: '1200ms' }}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 shrink-0">
                <Settings className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Personaliza tu equipo</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configura colores, escudo, datos bancarios y más para que tu equipo tenga su identidad.
                </p>
                <Link href="/admin/equipo">
                  <Button size="sm" variant="outline" className="mt-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                    Configurar ahora
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* FAB para móvil */}
      {isAdmin && <FloatingActionButton />}
    </div>
  )
}

function cn(...args: any[]) {
  return args.filter(Boolean).join(' ')
}
