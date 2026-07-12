import { Player, TeamEvent, EventType, Attendance } from './types'

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatRelative(isoStr: string): string {
  const now = Date.now()
  const then = new Date(isoStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  if (diffMin < 1) return 'hace un momento'
  if (diffMin < 60) return `hace ${diffMin} min`
  if (diffHr < 24) return `hace ${diffHr} h`
  if (diffDay === 1) return 'ayer'
  if (diffDay < 7) return `hace ${diffDay} días`
  return new Date(isoStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00').getTime()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function isUpcoming(event: TeamEvent): boolean {
  return event.status === 'programado' && daysUntil(event.date) >= 0
}

export function isPast(event: TeamEvent): boolean {
  return event.status === 'completado' || daysUntil(event.date) < 0
}

export function eventTypeLabel(type: EventType): string {
  const map: Record<EventType, string> = {
    entrenamiento: 'Entrenamiento',
    partido: 'Partido',
    torneo: 'Torneo',
    reunion: 'Reunión',
    evento: 'Evento',
  }
  return map[type]
}

export function eventTypeColor(type: EventType): string {
  const map: Record<EventType, string> = {
    entrenamiento: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    partido: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
    torneo: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    reunion: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800',
    evento: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
  }
  return map[type]
}

export function statusBadgeClass(status: Player['status']): string {
  const map = {
    disponible: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    lesionado: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    suspendido: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    ausente: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  }
  return map[status]
}

export function statusLabel(status: Player['status']): string {
  const map = {
    disponible: 'Disponible',
    lesionado: 'Lesionado',
    suspendido: 'Suspendido',
    ausente: 'Ausente',
  }
  return map[status]
}

export function positionColor(position: Player['primaryPosition']): string {
  const map = {
    Portero: 'bg-amber-500',
    Defensa: 'bg-sky-500',
    Mediocampista: 'bg-emerald-500',
    Delantero: 'bg-rose-500',
  }
  return map[position]
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function countAttendances(
  attendances: Attendance[],
  eventId: string
): { yes: number; no: number; maybe: number; pending: number } {
  const eventAttendances = attendances.filter((a) => a.eventId === eventId)
  const yes = eventAttendances.filter((a) => a.status === 'asistire').length
  const no = eventAttendances.filter((a) => a.status === 'no_asistire').length
  const maybe = eventAttendances.filter((a) => a.status === 'tal_vez').length
  return { yes, no, maybe, pending: 0 }
}

// Formaciones disponibles y posiciones por formación
export interface FormationDef {
  name: string
  // Etiquetas en orden: [POR, defensas..., mediocampistas..., delanteros...]
  positions: string[]
}

export const FORMATIONS: FormationDef[] = [
  { name: '4-3-3', positions: ['POR', 'LI', 'DFC', 'DFC', 'LD', 'MCD', 'MC', 'MCO', 'EI', 'DC', 'ED'] },
  { name: '4-4-2', positions: ['POR', 'LI', 'DFC', 'DFC', 'LD', 'MI', 'MCD', 'MC', 'MD', 'DC', 'DC'] },
  { name: '3-5-2', positions: ['POR', 'DFC', 'DFC', 'DFC', 'MC', 'MCD', 'MCO', 'MC', 'EI', 'DC', 'ED'] },
  { name: '4-2-3-1', positions: ['POR', 'LI', 'DFC', 'DFC', 'LD', 'MCD', 'MCD', 'EI', 'MCO', 'ED', 'DC'] },
  { name: '5-3-2', positions: ['POR', 'LI', 'DFC', 'DFC', 'DFC', 'LD', 'MC', 'MCO', 'MC', 'DC', 'DC'] },
]

// Coordenadas de cancha para cada posición según formación (en % de la cancha)
// La cancha se dibuja vertical: 0% arriba (defensa propia) -> 100% abajo (delantera)
export function getPositionCoords(formation: string, label: string): { x: number; y: number } | null {
  const coords: Record<string, { x: number; y: number }> = {
    'POR': { x: 50, y: 8 },
    'LI': { x: 12, y: 25 },
    'LD': { x: 88, y: 25 },
    'DFC': { x: 35, y: 22 },
    'DFC2': { x: 65, y: 22 },
    'DFC3': { x: 50, y: 18 },
    'MI': { x: 18, y: 50 },
    'MD': { x: 82, y: 50 },
    'MCD': { x: 35, y: 42 },
    'MCD2': { x: 65, y: 42 },
    'MC': { x: 50, y: 45 },
    'MCO': { x: 50, y: 60 },
    'EI': { x: 18, y: 75 },
    'ED': { x: 82, y: 75 },
    'DC': { x: 50, y: 88 },
    'DC2': { x: 35, y: 85 },
  }
  return coords[label] || null
}

// Mapeo: dada una formación, obtener la lista de etiquetas y sus coords
export function getFormationLayout(formation: string): { label: string; x: number; y: number }[] {
  const f = FORMATIONS.find((x) => x.name === formation)
  if (!f) return []
  // Para 4-3-3 usamos coordenadas específicas, para otras también
  return f.positions.map((label, idx) => {
    // Si hay dos DFC, el segundo usa DFC2
    if (label === 'DFC') {
      const count = f.positions.slice(0, idx).filter((l) => l === 'DFC').length
      const useLabel = count === 0 ? 'DFC' : 'DFC2'
      const c = getPositionCoords(formation, useLabel)!
      return { label: useLabel, x: c.x, y: c.y }
    }
    if (label === 'DC') {
      const count = f.positions.slice(0, idx).filter((l) => l === 'DC').length
      const useLabel = count === 0 ? 'DC' : 'DC2'
      const c = getPositionCoords(formation, useLabel)!
      return { label: useLabel, x: c.x, y: c.y }
    }
    if (label === 'MCD') {
      const count = f.positions.slice(0, idx).filter((l) => l === 'MCD').length
      const useLabel = count === 0 ? 'MCD' : 'MCD2'
      const c = getPositionCoords(formation, useLabel)!
      return { label: useLabel, x: c.x, y: c.y }
    }
    const c = getPositionCoords(formation, label) || { x: 50, y: 50 }
    return { label, x: c.x, y: c.y }
  })
}
