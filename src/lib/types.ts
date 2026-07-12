// Tipos de datos para la aplicación de gestión de equipos de fútbol

export type PlayerStatus = 'disponible' | 'lesionado' | 'suspendido' | 'ausente'
export type Position = 'Portero' | 'Defensa' | 'Mediocampista' | 'Delantero'
export type Foot = 'Diestro' | 'Zurdo' | 'Ambidiestro'
export type UserRole = 'administrador' | 'entrenador' | 'jugador' | 'cuerpo_tecnico' | 'acudiente' | 'seguidor'

export interface Player {
  id: string
  name: string
  jerseyNumber: number
  primaryPosition: Position
  secondaryPosition?: Position
  age: number
  dominantFoot: Foot
  height?: number // cm
  weight?: number // kg
  emergencyContact?: string
  phone?: string
  matchesPlayed: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  status: PlayerStatus
  photoUrl?: string
  // Estadísticas de asistencia a entrenamientos
  trainingsAttended: number
  trainingsTotal: number
}

export type EventType = 'entrenamiento' | 'partido' | 'torneo' | 'reunion' | 'evento'

export interface TeamEvent {
  id: string
  type: EventType
  title: string
  date: string // ISO date
  time: string // HH:mm
  endTime?: string
  location: string
  opponent?: string
  isHome?: boolean
  description?: string
  status: 'programado' | 'completado' | 'cancelado'
  // Resultado si es partido
  homeScore?: number
  awayScore?: number
  // Formación utilizada
  formation?: string
}

export type AttendanceStatus = 'asistire' | 'no_asistire' | 'tal_vez' | null

export interface Attendance {
  eventId: string
  playerId: string
  status: AttendanceStatus
  updatedAt: string
}

export interface Callup {
  eventId: string
  calledUpPlayerIds: string[]
  startingIds: string[]
  substituteIds: string[]
  captainId?: string
  formation: string // ej: "4-3-3"
  // Posiciones en la cancha: playerId -> posición (POR, LI, DC, etc.)
  positions: Record<string, string>
}

export interface Announcement {
  id: string
  title: string
  content: string
  author: string
  authorRole: UserRole
  date: string
  pinned: boolean
  readBy: string[] // playerIds que han marcado como leído
  category: 'general' | 'convocatoria' | 'evento' | 'urgente'
}

export interface MatchStat {
  id: string
  eventId: string
  playerId: string
  goals: number
  assists: number
  minutesPlayed: number
  yellowCards: number
  redCards: number
  saves: number
  shots: number
  recoveries: number
  isMotm: boolean // figura del partido
}

export interface StandingRow {
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
  isOurTeam?: boolean
}

export interface Team {
  name: string
  shortName: string
  category: string
  coachName: string
  primaryColor: string
  foundedYear: number
}

// Estado global de la app
export interface AppState {
  team: Team
  players: Player[]
  events: TeamEvent[]
  attendances: Attendance[]
  callups: Callup[]
  announcements: Announcement[]
  matchStats: MatchStat[]
  standings: StandingRow[]
  // Usuario actual (demo: asumimos rol de entrenador)
  currentUserId: string
  currentUserRole: UserRole
  currentUserName: string
  // Vista activa
  activeView: string
  // Evento seleccionado para detalle
  selectedEventId: string | null
}
