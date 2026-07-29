'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Loader2, TrendingUp, Trophy, Target, Users, DollarSign } from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'

interface StatsData {
  performanceByMatch: Array<{ title: string; date: string; our: number; opp: number; result: string }>
  goalsByPlayer: Array<{ name: string; fullName: string; goles: number; asistencias: number }>
  attendanceByMonth: Array<{ month: string; entrenamientos: number; asistencias: number }>
  positionDistribution: Array<{ name: string; value: number }>
  revenueByMonth: Array<{ month: string; recaudado: number }>
  summary: {
    totalMatches: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
    winRate: number
  }
}

const PIE_COLORS = ['#f59e0b', '#0ea5e9', '#10b981', '#f43f5e']

export function StatsView({ teamName, teamShortName }: { teamName: string; teamShortName: string }) {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.ok ? res.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-deportivo flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-deportivo">
        <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
          <div className="mx-auto max-w-5xl px-4 py-3">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver
            </Link>
            <h1 className="text-xl font-bold mt-2">Estadísticas</h1>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No hay datos suficientes para mostrar estadísticas.</p>
          </CardContent></Card>
        </main>
      </div>
    )
  }

  const { summary } = data

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-xl font-bold">Estadísticas</h1>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => window.open('/api/export?type=stats', '_blank')}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-24 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-green-950/10">
            <CardContent className="p-4">
              <Trophy className="h-5 w-5 text-emerald-400 mb-2" />
              <p className="text-[10px] text-muted-foreground uppercase">Efectividad</p>
              <p className="text-2xl font-black text-emerald-400">{summary.winRate}%</p>
              <p className="text-[10px] text-muted-foreground">{summary.wins}G · {summary.draws}E · {summary.losses}P</p>
            </CardContent>
          </Card>
          <Card className="border-sky-500/20 bg-gradient-to-br from-sky-950/30 to-blue-950/10">
            <CardContent className="p-4">
              <Target className="h-5 w-5 text-sky-400 mb-2" />
              <p className="text-[10px] text-muted-foreground uppercase">Goles a favor</p>
              <p className="text-2xl font-black text-sky-400">{summary.goalsFor}</p>
              <p className="text-[10px] text-muted-foreground">en {summary.totalMatches} partidos</p>
            </CardContent>
          </Card>
          <Card className="border-rose-500/20 bg-gradient-to-br from-rose-950/30 to-red-950/10">
            <CardContent className="p-4">
              <Target className="h-5 w-5 text-rose-400 mb-2" />
              <p className="text-[10px] text-muted-foreground uppercase">Goles en contra</p>
              <p className="text-2xl font-black text-rose-400">{summary.goalsAgainst}</p>
              <p className="text-[10px] text-muted-foreground">diferencia {summary.goalsFor - summary.goalsAgainst > 0 ? '+' : ''}{summary.goalsFor - summary.goalsAgainst}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-950/30 to-yellow-950/10">
            <CardContent className="p-4">
              <DollarSign className="h-5 w-5 text-amber-400 mb-2" />
              <p className="text-[10px] text-muted-foreground uppercase">Recaudado 6m</p>
              <p className="text-2xl font-black text-amber-400">
                ${data.revenueByMonth.reduce((s, m) => s + m.recaudado, 0).toLocaleString('es-CO')}
              </p>
              <p className="text-[10px] text-muted-foreground">total verificado</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/5 bg-gradient-card">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Resultados últimos 10 partidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.performanceByMatch.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay partidos completados aún.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.performanceByMatch}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="our" name="Nosotros" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="opp" name="Rival" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-gradient-card">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Goleadores y asistidores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.goalsByPlayer.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay goles registrados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.goalsByPlayer} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#888' }} width={70} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="goles" name="Goles" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="asistencias" name="Asistencias" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-gradient-card">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Asistencia a entrenamientos (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.attendanceByMonth.every(m => m.entrenamientos === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay entrenamientos registrados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data.attendanceByMonth}>
                  <defs>
                    <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="entrenamientos" name="Entrenamientos" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="asistencias" name="Check-ins" stroke="#10b981" fillOpacity={1} fill="url(#colorAtt)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-white/5 bg-gradient-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Plantilla por posición
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.positionDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin jugadores.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.positionDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry: any) => `${entry.value}`}
                      labelLine={false}
                    >
                      {data.positionDistribution.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-gradient-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Recaudación (6 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.revenueByMonth.every(m => m.recaudado === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin pagos verificados.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#888' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                      formatter={(value: any) => [`$${Number(value).toLocaleString('es-CO')}`, 'Recaudado']}
                    />
                    <Line type="monotone" dataKey="recaudado" name="Recaudado" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
