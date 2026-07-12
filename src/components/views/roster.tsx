'use client'

import { useAppStore } from '@/lib/store'
import {
  positionColor, statusBadgeClass, statusLabel, initials,
} from '@/lib/helpers'
import { PlayerAvatar } from '@/components/app/player-avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Trophy, Goal, Hand, Shield as ShieldIcon, Phone, Ruler, Weight, Calendar as CalIcon, Footprints } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Player, Position, PlayerStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function RosterView() {
  const players = useAppStore((s) => s.players)
  const updatePlayer = useAppStore((s) => s.updatePlayer)
  const [search, setSearch] = useState('')
  const [filterPosition, setFilterPosition] = useState<string>('todas')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  const filtered = useMemo(() => {
    return players
      .filter((p) => {
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
        if (filterPosition !== 'todas' && p.primaryPosition !== filterPosition) return false
        if (filterStatus !== 'todos' && p.status !== filterStatus) return false
        return true
      })
      .sort((a, b) => a.jerseyNumber - b.jerseyNumber)
  }, [players, search, filterPosition, filterStatus])

  // Estadísticas top
  const topScorer = [...players].sort((a, b) => b.goals - a.goals)[0]
  const topAssister = [...players].sort((a, b) => b.assists - a.assists)[0]
  const mostTrained = [...players].sort((a, b) => (b.trainingsAttended / b.trainingsTotal) - (a.trainingsAttended / a.trainingsTotal))[0]
  const mostPlayed = [...players].sort((a, b) => b.matchesPlayed - a.matchesPlayed)[0]

  return (
    <div className="space-y-4">
      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Goal className="h-4 w-4" />}
          label="Goleador"
          playerName={topScorer?.name || '-'}
          value={topScorer?.goals || 0}
          suffix="goles"
          color="bg-rose-500"
          onClick={() => topScorer && setSelectedPlayer(topScorer)}
        />
        <StatCard
          icon={<Hand className="h-4 w-4" />}
          label="Asistidor"
          playerName={topAssister?.name || '-'}
          value={topAssister?.assists || 0}
          suffix="asistencias"
          color="bg-emerald-500"
          onClick={() => topAssister && setSelectedPlayer(topAssister)}
        />
        <StatCard
          icon={<CalIcon className="h-4 w-4" />}
          label="Más entrenado"
          playerName={mostTrained?.name || '-'}
          value={mostTrained ? Math.round((mostTrained.trainingsAttended / mostTrained.trainingsTotal) * 100) : 0}
          suffix="%"
          color="bg-sky-500"
          onClick={() => mostTrained && setSelectedPlayer(mostTrained)}
        />
        <StatCard
          icon={<ShieldIcon className="h-4 w-4" />}
          label="Más minutos"
          playerName={mostPlayed?.name || '-'}
          value={mostPlayed?.matchesPlayed || 0}
          suffix="partidos"
          color="bg-amber-500"
          onClick={() => mostPlayed && setSelectedPlayer(mostPlayed)}
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar jugador…"
                className="pl-9"
              />
            </div>
            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Posición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las posiciones</SelectItem>
                <SelectItem value="Portero">Porteros</SelectItem>
                <SelectItem value="Defensa">Defensas</SelectItem>
                <SelectItem value="Mediocampista">Mediocampistas</SelectItem>
                <SelectItem value="Delantero">Delanteros</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="disponible">Disponibles</SelectItem>
                <SelectItem value="lesionado">Lesionados</SelectItem>
                <SelectItem value="suspendido">Suspendidos</SelectItem>
                <SelectItem value="ausente">Ausentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {filtered.length} jugador{filtered.length !== 1 ? 'es' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Lista de jugadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onClick={() => setSelectedPlayer(player)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No se encontraron jugadores.</p>
          </CardContent>
        </Card>
      )}

      {/* Modal detalle */}
      {selectedPlayer && (
        <PlayerDetailDialog
          player={selectedPlayer}
          open={!!selectedPlayer}
          onOpenChange={(open) => !open && setSelectedPlayer(null)}
          onUpdate={(status) => {
            updatePlayer(selectedPlayer.id, { status })
            toast.success('Estado del jugador actualizado')
            setSelectedPlayer({ ...selectedPlayer, status })
          }}
        />
      )}
    </div>
  )
}

function StatCard({
  icon, label, playerName, value, suffix, color, onClick,
}: {
  icon: React.ReactNode
  label: string
  playerName: string
  value: number
  suffix: string
  color: string
  onClick?: () => void
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('flex h-6 w-6 items-center justify-center rounded text-white', color)}>
            {icon}
          </span>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <p className="font-bold text-sm truncate">{playerName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          <span className="font-bold text-foreground text-base">{value}</span> {suffix}
        </p>
      </CardContent>
    </Card>
  )
}

function PlayerCard({ player, onClick }: { player: Player; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-xl font-bold text-white text-lg ring-2 ring-background',
                positionColor(player.primaryPosition)
              )}
            >
              {initials(player.name)}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-background text-foreground text-[11px] font-bold px-1.5 border-2 shadow-sm">
              {player.jerseyNumber}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">{player.name}</h3>
            <p className="text-xs text-muted-foreground">{player.primaryPosition}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="outline" className={cn('text-[10px]', statusBadgeClass(player.status))}>
                {statusLabel(player.status)}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{player.age} años</span>
            </div>
          </div>
        </div>

        {/* Mini stats */}
        <div className="mt-3 pt-3 border-t grid grid-cols-4 gap-1 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground">PJ</p>
            <p className="font-bold text-sm">{player.matchesPlayed}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Goles</p>
            <p className="font-bold text-sm text-rose-600">{player.goals}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Asist.</p>
            <p className="font-bold text-sm text-emerald-600">{player.assists}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">TA/TR</p>
            <p className="font-bold text-sm">
              <span className="text-amber-600">{player.yellowCards}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-rose-600">{player.redCards}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PlayerDetailDialog({
  player, open, onOpenChange, onUpdate,
}: {
  player: Player
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (status: PlayerStatus) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{player.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Perfil y estadísticas del jugador
          </DialogDescription>
        </DialogHeader>
        <div>
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <div
                className={cn(
                  'flex h-20 w-20 items-center justify-center rounded-2xl font-bold text-white text-2xl',
                  positionColor(player.primaryPosition)
                )}
              >
                {initials(player.name)}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-background text-foreground text-sm font-bold px-2 border-2 shadow-sm">
                {player.jerseyNumber}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold leading-tight">{player.name}</h2>
              <p className="text-sm text-muted-foreground">
                {player.primaryPosition}
                {player.secondaryPosition && ` / ${player.secondaryPosition}`}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className={cn('text-[11px]', statusBadgeClass(player.status))}>
                  {statusLabel(player.status)}
                </Badge>
                <Badge variant="outline" className="text-[11px]">
                  <Footprints className="h-3 w-3 mr-1" /> {player.dominantFoot}
                </Badge>
                <Badge variant="outline" className="text-[11px]">{player.age} años</Badge>
              </div>
            </div>
          </div>

          {/* Cambiar estado (entrenador) */}
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Cambiar estado</p>
            <Select value={player.status} onValueChange={(v) => onUpdate(v as PlayerStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="lesionado">Lesionado</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
                <SelectItem value="ausente">Ausente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estadísticas */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatBox label="Partidos" value={player.matchesPlayed} />
            <StatBox label="Goles" value={player.goals} color="text-rose-600" />
            <StatBox label="Asistencias" value={player.assists} color="text-emerald-600" />
            <StatBox label="Minutos" value={player.matchesPlayed * 75} color="text-sky-600" />
            <StatBox label="Tarj. amarillas" value={player.yellowCards} color="text-amber-600" />
            <StatBox label="Tarj. rojas" value={player.redCards} color="text-rose-600" />
            <StatBox
              label="Asistencia entren."
              value={`${Math.round((player.trainingsAttended / player.trainingsTotal) * 100)}%`}
              color="text-sky-600"
            />
            <StatBox label="Entrenamientos" value={`${player.trainingsAttended}/${player.trainingsTotal}`} />
          </div>

          {/* Datos físicos */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {player.height && (
              <InfoRow icon={<Ruler className="h-4 w-4" />} label="Altura" value={`${player.height} cm`} />
            )}
            {player.weight && (
              <InfoRow icon={<Weight className="h-4 w-4" />} label="Peso" value={`${player.weight} kg`} />
            )}
            {player.phone && (
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Teléfono" value={player.phone} />
            )}
            {player.emergencyContact && (
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Contacto emergencia" value={player.emergencyContact} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatBox({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/50 text-center">
      <p className="text-[10px] text-muted-foreground uppercase font-medium">{label}</p>
      <p className={cn('font-bold text-lg tabular-nums', color)}>{value}</p>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border">
      <span className="text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-medium truncate">{value}</p>
      </div>
    </div>
  )
}
