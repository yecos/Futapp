'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import {
  ArrowLeft, Crown, Star, Goal, Hand, Shield, Zap, TrendingUp,
  Calendar, MapPin, Phone, AlertTriangle, Footprints, Ruler, Weight,
} from 'lucide-react'
import { useState } from 'react'

interface PlayerData {
  id: string
  fullName: string
  firstName: string
  lastName: string
  jerseyNumber: number
  primaryPosition: string
  secondaryPosition: string | null
  age: number
  dominantFoot: string
  height: number | null
  weight: number | null
  phone: string | null
  emergencyContact: string | null
  status: string
  matchesPlayed: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  trainingsAttended: number
  trainingsTotal: number
  photoUrl: string | null
}

interface MatchStatData {
  goals: number
  assists: number
  minutesPlayed: number
  yellowCards: number
  redCards: number
  saves: number
  shots: number
  recoveries: number
  isMotm: boolean
  event: {
    title: string
    date: string
    opponent: string | null
    isHome: boolean | null
    homeScore: number | null
    awayScore: number | null
  }
}

interface PlayerProfileProps {
  player: PlayerData
  matchStats: MatchStatData[]
  userRole: string
}

const POSITION_SHORT: Record<string, string> = {
  PORTERO: 'POR',
  DEFENSA: 'DEF',
  MEDIOCAMPISTA: 'MED',
  DELANTERO: 'DEL',
}

const POSITION_LABELS: Record<string, string> = {
  PORTERO: 'Portero',
  DEFENSA: 'Defensa',
  MEDIOCAMPISTA: 'Mediocampista',
  DELANTERO: 'Delantero',
}

const STATUS_LABELS: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  LESIONADO: 'Lesionado',
  SUSPENDIDO: 'Suspendido',
  AUSENTE: 'Ausente',
}

const STATUS_COLORS: Record<string, string> = {
  DISPONIBLE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  LESIONADO: 'bg-red-500/20 text-red-400 border-red-500/30',
  SUSPENDIDO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  AUSENTE: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}

function calculateFUTStats(player: PlayerData) {
  const goals = player.goals || 0
  const assists = player.assists || 0

  const basePace = 85 - Math.max(0, (player.age || 25) - 20)
  const pac = Math.min(99, Math.max(40, basePace + (goals * 2)))
  const sho = Math.min(99, Math.max(40, 60 + (goals * 4)))
  const pas = Math.min(99, Math.max(40, 60 + (assists * 5)))
  const posBonus = player.primaryPosition === 'DELANTERO' ? 8 : player.primaryPosition === 'MEDIOCAMPISTA' ? 5 : 2
  const dri = Math.min(99, Math.max(40, 65 + posBonus))
  const defBonus = player.primaryPosition === 'DEFENSA' ? 25 : player.primaryPosition === 'PORTERO' ? 20 : player.primaryPosition === 'MEDIOCAMPISTA' ? 10 : 5
  const def = Math.min(99, Math.max(40, 50 + defBonus))
  const phy = Math.min(99, Math.max(40, 60 + Math.floor((player.weight || 70) / 4)))

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

function getCardVariant(rating: number, isMotm: boolean): 'gold' | 'silver' | 'bronze' | 'icon' | 'hero' {
  if (isMotm) return 'hero'
  if (rating >= 85) return 'gold'
  if (rating >= 75) return 'silver'
  return 'bronze'
}

const VARIANT_STYLES = {
  gold: {
    card: 'from-amber-900/60 via-amber-800/40 to-yellow-900/50 border-amber-500/50',
    glow: 'shadow-[0_0_40px_rgba(251,191,36,0.3)]',
    rating: 'text-amber-300',
    stat: 'text-amber-400',
  },
  silver: {
    card: 'from-slate-700/60 via-slate-600/40 to-slate-800/50 border-slate-400/50',
    glow: 'shadow-[0_0_30px_rgba(148,163,184,0.2)]',
    rating: 'text-slate-200',
    stat: 'text-slate-300',
  },
  bronze: {
    card: 'from-orange-900/60 via-orange-800/40 to-amber-900/50 border-orange-600/50',
    glow: 'shadow-[0_0_30px_rgba(234,88,12,0.2)]',
    rating: 'text-orange-300',
    stat: 'text-orange-400',
  },
  icon: {
    card: 'from-violet-900/60 via-fuchsia-800/40 to-purple-900/50 border-fuchsia-500/50',
    glow: 'shadow-[0_0_40px_rgba(217,70,239,0.3)]',
    rating: 'text-fuchsia-300',
    stat: 'text-fuchsia-400',
  },
  hero: {
    card: 'from-emerald-900/60 via-emerald-800/40 to-teal-900/50 border-emerald-500/50',
    glow: 'shadow-[0_0_40px_rgba(16,185,129,0.3)]',
    rating: 'text-emerald-300',
    stat: 'text-emerald-400',
  },
}

export function PlayerProfile({ player, matchStats, userRole }: PlayerProfileProps) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  const stats = calculateFUTStats(player)
  const hasMotm = matchStats.some(s => s.isMotm)
  const variant = getCardVariant(stats.rating, hasMotm)
  const styles = VARIANT_STYLES[variant]
  const posShort = POSITION_SHORT[player.primaryPosition] || 'MED'
  const initials = (player.firstName?.[0] || '') + (player.lastName?.[0] || player.fullName[0] || '')
  const canSeeContact = ['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(userRole)

  const motmCount = matchStats.filter(s => s.isMotm).length
  const totalGoals = matchStats.reduce((sum, s) => sum + s.goals, 0)
  const totalAssists = matchStats.reduce((sum, s) => sum + s.assists, 0)
  const trainingPct = player.trainingsTotal > 0 ? Math.round((player.trainingsAttended / player.trainingsTotal) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-deportivo">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <button
            onClick={() => router.push('/plantilla')}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Plantilla
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
        {/* === CARTA FUT === */}
        <div className="flex justify-center mb-6 animate-bounce-in">
          <div className={`relative w-72 ${styles.glow}`}>
            <div className={`relative rounded-3xl border-2 bg-gradient-to-br ${styles.card} p-5 overflow-hidden`}>
              {/* Brillo diagonal */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0" />

              {/* Header: Rating + Posición */}
              <div className="relative flex items-start justify-between mb-3">
                <div className="flex flex-col items-center">
                  <span className={`text-5xl font-black tabular-nums leading-none ${styles.rating}`}>
                    {stats.rating}
                  </span>
                  <span className={`text-sm font-bold mt-1 ${styles.rating}`}>{posShort}</span>
                </div>

                {/* Estado */}
                {player.status !== 'DISPONIBLE' && (
                  <div className={`px-2 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[player.status]}`}>
                    {STATUS_LABELS[player.status]}
                  </div>
                )}
              </div>

              {/* Foto */}
              <div className="relative flex justify-center mb-3">
                <div className="relative">
                  {player.photoUrl && !imageError ? (
                    <img
                      src={player.photoUrl}
                      alt={player.fullName}
                      onError={() => setImageError(true)}
                      className="h-28 w-28 rounded-full object-cover border-4 border-white/20"
                    />
                  ) : (
                    <div className="h-28 w-28 rounded-full flex items-center justify-center text-3xl font-black bg-gradient-to-br from-primary/40 to-primary/10 border-4 border-white/20 text-primary-foreground">
                      {initials}
                    </div>
                  )}
                  {/* Dorsal */}
                  <div className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <span className="text-sm font-black text-primary">{player.jerseyNumber}</span>
                  </div>
                  {/* MOTM crown */}
                  {hasMotm && (
                    <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-amber-500 flex items-center justify-center">
                      <Crown className="h-4 w-4 text-amber-900" />
                    </div>
                  )}
                </div>
              </div>

              {/* Nombre */}
              <h2 className="text-center font-black text-lg mb-1">{player.fullName}</h2>
              <p className="text-center text-xs text-muted-foreground mb-4">
                {POSITION_LABELS[player.primaryPosition]}
                {player.secondaryPosition && ` / ${POSITION_LABELS[player.secondaryPosition]}`}
                {' · '}{player.age} años · {player.dominantFoot}
              </p>

              {/* Stats FUT */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <FUTStat label="PAC" value={stats.pac} color={styles.stat} />
                <FUTStat label="SHO" value={stats.sho} color={styles.stat} />
                <FUTStat label="PAS" value={stats.pas} color={styles.stat} />
                <FUTStat label="DRI" value={stats.dri} color={styles.stat} />
                <FUTStat label="DEF" value={stats.def} color={styles.stat} />
                <FUTStat label="PHY" value={stats.phy} color={styles.stat} />
              </div>

              {/* Stats reales */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/10">
                <RealStat icon={Calendar} value={player.matchesPlayed} label="PJ" color="text-sky-400" />
                <RealStat icon={Goal} value={player.goals} label="Goles" color="text-rose-400" />
                <RealStat icon={Hand} value={player.assists} label="Asist." color="text-emerald-400" />
                <RealStat icon={Crown} value={motmCount} label="Figura" color="text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* === TARJETAS === */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="border-amber-500/20 bg-amber-950/20">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Amarillas</p>
              <p className="text-2xl font-black text-amber-400">{player.yellowCards}</p>
            </CardContent>
          </Card>
          <Card className="border-rose-500/20 bg-rose-950/20">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Rojas</p>
              <p className="text-2xl font-black text-rose-400">{player.redCards}</p>
            </CardContent>
          </Card>
        </div>

        {/* === ASISTENCIA A ENTRENAMIENTOS === */}
        <Card className="border-white/5 bg-gradient-card mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Asistencia a entrenamientos</span>
              <span className="text-lg font-bold text-primary">{trainingPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-black/30 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${trainingPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {player.trainingsAttended} de {player.trainingsTotal} entrenamientos
            </p>
          </CardContent>
        </Card>

        {/* === DATOS PERSONALES === */}
        {canSeeContact && (
          <Card className="border-white/5 bg-gradient-card mb-4">
            <CardContent className="p-4">
              <h3 className="text-sm font-bold mb-3">Datos personales</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {player.height && (
                  <InfoRow icon={<Ruler className="h-4 w-4" />} label="Altura" value={`${player.height} cm`} />
                )}
                {player.weight && (
                  <InfoRow icon={<Weight className="h-4 w-4" />} label="Peso" value={`${player.weight} kg`} />
                )}
                {player.phone && (
                  <InfoRow icon={<Phone className="h-4 w-4" />} label="Teléfono" value={player.phone} />
                )}
                {player.dominantFoot && (
                  <InfoRow icon={<Footprints className="h-4 w-4" />} label="Pierna" value={player.dominantFoot} />
                )}
              </div>
              {player.emergencyContact && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Emergencia: {player.emergencyContact}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* === HISTORIAL DE PARTIDOS === */}
        {matchStats.length > 0 && (
          <div>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" />
              Últimos partidos ({matchStats.length})
            </h3>
            <div className="space-y-2">
              {matchStats.map((stat, i) => {
                const m = stat.event
                const ourScore = m.isHome ? m.homeScore : m.awayScore
                const oppScore = m.isHome ? m.awayScore : m.homeScore
                const isWin = (ourScore ?? 0) > (oppScore ?? 0)
                const isDraw = ourScore === oppScore
                return (
                  <Card key={i} className="border-white/5 bg-card/50 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg font-black text-xs ${
                          isWin ? 'bg-emerald-500/20 text-emerald-400' :
                          isDraw ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {isWin ? 'G' : isDraw ? 'E' : 'P'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{m.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(m.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                            {' · '}{ourScore}-{oppScore}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {stat.goals > 0 && (
                            <Badge className="bg-rose-500/20 text-rose-400 text-[10px]">
                              <Goal className="h-2.5 w-2.5 mr-0.5" /> {stat.goals}
                            </Badge>
                          )}
                          {stat.assists > 0 && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                              <Hand className="h-2.5 w-2.5 mr-0.5" /> {stat.assists}
                            </Badge>
                          )}
                          {stat.isMotm && (
                            <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">
                              <Crown className="h-2.5 w-2.5 mr-0.5" /> MOTM
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function FUTStat({ label, value, color }: { label: string; value: number; color: string }) {
  const valColor = value >= 85 ? 'text-emerald-400' : value >= 70 ? 'text-amber-300' : 'text-orange-400'
  return (
    <div className="flex items-center gap-1.5 bg-black/30 rounded-lg px-2 py-1.5">
      <span className={`font-black tabular-nums text-lg ${valColor}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground font-bold">{label}</span>
    </div>
  )
}

function RealStat({ icon: Icon, value, label, color }: { icon: any; value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <Icon className={`h-4 w-4 mx-auto mb-0.5 ${color}`} />
      <p className={`font-black text-lg ${color}`}>
        <AnimatedCounter value={value} />
      </p>
      <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-medium">{value}</p>
      </div>
    </div>
  )
}
