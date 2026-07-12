import { Player, TeamEvent, Announcement, StandingRow, Team, MatchStat, Attendance, Callup } from './types'

// Equipo demo: "Los Halcones FC" - equipo aficionado de categoría adulta
export const seedTeam: Team = {
  name: 'Los Halcones FC',
  shortName: 'HFC',
  category: 'Senior Amateur - Liga Municipal',
  coachName: 'Carlos Mendoza',
  primaryColor: '#16a34a',
  foundedYear: 2015,
}

// 18 jugadores con perfiles diversos
export const seedPlayers: Player[] = [
  {
    id: 'p1', name: 'Andrés Gómez', jerseyNumber: 1, primaryPosition: 'Portero',
    secondaryPosition: undefined, age: 28, dominantFoot: 'Diestro', height: 184, weight: 80,
    emergencyContact: 'María Gómez - 3105551001', phone: '3105551001',
    matchesPlayed: 14, goals: 0, assists: 1, yellowCards: 1, redCards: 0,
    status: 'disponible', trainingsAttended: 22, trainingsTotal: 26,
  },
  {
    id: 'p2', name: 'Sebastián Ríos', jerseyNumber: 2, primaryPosition: 'Defensa',
    secondaryPosition: 'Mediocampista', age: 26, dominantFoot: 'Diestro', height: 178, weight: 74,
    emergencyContact: 'Lucía Ríos - 3105551002', phone: '3105551002',
    matchesPlayed: 15, goals: 1, assists: 2, yellowCards: 3, redCards: 0,
    status: 'disponible', trainingsAttended: 25, trainingsTotal: 26,
  },
  {
    id: 'p3', name: 'Mateo Vargas', jerseyNumber: 3, primaryPosition: 'Defensa',
    secondaryPosition: undefined, age: 24, dominantFoot: 'Zurdo', height: 180, weight: 76,
    emergencyContact: 'Pedro Vargas - 3105551003', phone: '3105551003',
    matchesPlayed: 13, goals: 0, assists: 3, yellowCards: 2, redCards: 0,
    status: 'disponible', trainingsAttended: 20, trainingsTotal: 26,
  },
  {
    id: 'p4', name: 'Diego Torres', jerseyNumber: 4, primaryPosition: 'Defensa',
    secondaryPosition: 'Mediocampista', age: 30, dominantFoot: 'Diestro', height: 182, weight: 79,
    emergencyContact: 'Ana Torres - 3105551004', phone: '3105551004',
    matchesPlayed: 15, goals: 2, assists: 1, yellowCards: 4, redCards: 1,
    status: 'suspendido', trainingsAttended: 24, trainingsTotal: 26,
  },
  {
    id: 'p5', name: 'Felipe Castro', jerseyNumber: 5, primaryPosition: 'Defensa',
    secondaryPosition: undefined, age: 27, dominantFoot: 'Diestro', height: 186, weight: 82,
    emergencyContact: 'Carolina Castro - 3105551005', phone: '3105551005',
    matchesPlayed: 14, goals: 1, assists: 0, yellowCards: 2, redCards: 0,
    status: 'disponible', trainingsAttended: 23, trainingsTotal: 26,
  },
  {
    id: 'p6', name: 'Juan Herrera', jerseyNumber: 6, primaryPosition: 'Mediocampista',
    secondaryPosition: 'Defensa', age: 25, dominantFoot: 'Diestro', height: 175, weight: 70,
    emergencyContact: 'Sofía Herrera - 3105551006', phone: '3105551006',
    matchesPlayed: 15, goals: 3, assists: 5, yellowCards: 1, redCards: 0,
    status: 'disponible', trainingsAttended: 26, trainingsTotal: 26,
  },
  {
    id: 'p7', name: 'Santiago Ortega', jerseyNumber: 7, primaryPosition: 'Mediocampista',
    secondaryPosition: 'Delantero', age: 23, dominantFoot: 'Zurdo', height: 172, weight: 68,
    emergencyContact: 'Ricardo Ortega - 3105551007', phone: '3105551007',
    matchesPlayed: 14, goals: 4, assists: 3, yellowCards: 2, redCards: 0,
    status: 'disponible', trainingsAttended: 24, trainingsTotal: 26,
  },
  {
    id: 'p8', name: 'Nicolás Mejía', jerseyNumber: 8, primaryPosition: 'Mediocampista',
    secondaryPosition: undefined, age: 28, dominantFoot: 'Diestro', height: 177, weight: 72,
    emergencyContact: 'Paola Mejía - 3105551008', phone: '3105551008',
    matchesPlayed: 15, goals: 2, assists: 6, yellowCards: 3, redCards: 0,
    status: 'disponible', trainingsAttended: 25, trainingsTotal: 26,
  },
  {
    id: 'p9', name: 'Camilo Rojas', jerseyNumber: 9, primaryPosition: 'Delantero',
    secondaryPosition: undefined, age: 26, dominantFoot: 'Diestro', height: 180, weight: 75,
    emergencyContact: 'Diana Rojas - 3105551009', phone: '3105551009',
    matchesPlayed: 15, goals: 12, assists: 4, yellowCards: 1, redCards: 0,
    status: 'disponible', trainingsAttended: 22, trainingsTotal: 26,
  },
  {
    id: 'p10', name: 'Tomás Álvarez', jerseyNumber: 10, primaryPosition: 'Mediocampista',
    secondaryPosition: 'Delantero', age: 27, dominantFoot: 'Zurdo', height: 174, weight: 69,
    emergencyContact: 'Marcela Álvarez - 3105551010', phone: '3105551010',
    matchesPlayed: 14, goals: 6, assists: 8, yellowCards: 2, redCards: 0,
    status: 'disponible', trainingsAttended: 24, trainingsTotal: 26,
  },
  {
    id: 'p11', name: 'Samuel Quintero', jerseyNumber: 11, primaryPosition: 'Delantero',
    secondaryPosition: 'Mediocampista', age: 22, dominantFoot: 'Diestro', height: 176, weight: 71,
    emergencyContact: 'Jorge Quintero - 3105551011', phone: '3105551011',
    matchesPlayed: 13, goals: 7, assists: 2, yellowCards: 0, redCards: 0,
    status: 'disponible', trainingsAttended: 21, trainingsTotal: 26,
  },
  {
    id: 'p12', name: 'David Mora', jerseyNumber: 12, primaryPosition: 'Portero',
    secondaryPosition: undefined, age: 24, dominantFoot: 'Diestro', height: 181, weight: 78,
    emergencyContact: 'Elena Mora - 3105551012', phone: '3105551012',
    matchesPlayed: 2, goals: 0, assists: 0, yellowCards: 0, redCards: 0,
    status: 'disponible', trainingsAttended: 20, trainingsTotal: 26,
  },
  {
    id: 'p13', name: 'Andrés Salazar', jerseyNumber: 13, primaryPosition: 'Defensa',
    secondaryPosition: 'Mediocampista', age: 29, dominantFoot: 'Diestro', height: 179, weight: 75,
    emergencyContact: 'Patricia Salazar - 3105551013', phone: '3105551013',
    matchesPlayed: 12, goals: 0, assists: 2, yellowCards: 3, redCards: 0,
    status: 'disponible', trainingsAttended: 22, trainingsTotal: 26,
  },
  {
    id: 'p14', name: 'Lucas Cardona', jerseyNumber: 14, primaryPosition: 'Mediocampista',
    secondaryPosition: undefined, age: 21, dominantFoot: 'Ambidiestro', height: 173, weight: 68,
    emergencyContact: 'Fernando Cardona - 3105551014', phone: '3105551014',
    matchesPlayed: 10, goals: 2, assists: 3, yellowCards: 1, redCards: 0,
    status: 'disponible', trainingsAttended: 19, trainingsTotal: 26,
  },
  {
    id: 'p15', name: 'Daniel Patiño', jerseyNumber: 15, primaryPosition: 'Defensa',
    secondaryPosition: undefined, age: 26, dominantFoot: 'Zurdo', height: 183, weight: 80,
    emergencyContact: 'Adriana Patiño - 3105551015', phone: '3105551015',
    matchesPlayed: 11, goals: 1, assists: 1, yellowCards: 2, redCards: 0,
    status: 'lesionado', trainingsAttended: 18, trainingsTotal: 26,
  },
  {
    id: 'p16', name: 'Pablo Navarro', jerseyNumber: 16, primaryPosition: 'Delantero',
    secondaryPosition: 'Mediocampista', age: 25, dominantFoot: 'Diestro', height: 178, weight: 73,
    emergencyContact: 'Beatriz Navarro - 3105551016', phone: '3105551016',
    matchesPlayed: 12, goals: 5, assists: 3, yellowCards: 1, redCards: 0,
    status: 'disponible', trainingsAttended: 23, trainingsTotal: 26,
  },
  {
    id: 'p17', name: 'Mateo Lozano', jerseyNumber: 17, primaryPosition: 'Mediocampista',
    secondaryPosition: 'Defensa', age: 24, dominantFoot: 'Diestro', height: 176, weight: 71,
    emergencyContact: 'Gloria Lozano - 3105551017', phone: '3105551017',
    matchesPlayed: 9, goals: 1, assists: 2, yellowCards: 2, redCards: 0,
    status: 'disponible', trainingsAttended: 20, trainingsTotal: 26,
  },
  {
    id: 'p18', name: 'Kevin Ramírez', jerseyNumber: 18, primaryPosition: 'Delantero',
    secondaryPosition: undefined, age: 23, dominantFoot: 'Zurdo', height: 177, weight: 72,
    emergencyContact: 'Oscar Ramírez - 3105551018', phone: '3105551018',
    matchesPlayed: 8, goals: 3, assists: 1, yellowCards: 0, redCards: 0,
    status: 'disponible', trainingsAttended: 17, trainingsTotal: 26,
  },
]

// Función auxiliar para crear fechas ISO relativas a hoy
function dateOffset(days: number, hour = 18, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function dateOnly(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Eventos: partidos y entrenamientos pasados y futuros
export const seedEvents: TeamEvent[] = [
  // === Próximos eventos ===
  {
    id: 'e1', type: 'entrenamiento', title: 'Entrenamiento táctico',
    date: dateOnly(1), time: '18:30', endTime: '20:00',
    location: 'Cancha Municipal - Sector Norte',
    description: 'Trabajo de posesión y transiciones rápidas. Llevar diario de entrenamiento.',
    status: 'programado',
  },
  {
    id: 'e2', type: 'partido', title: 'Partido vs Tigres del Norte',
    date: dateOnly(4), time: '15:00', endTime: '17:00',
    location: 'Estadio La Esperanza',
    opponent: 'Tigres del Norte', isHome: true,
    description: 'Jornada 12 del torneo clausura. Llegar 1 hora antes.',
    status: 'programado',
  },
  {
    id: 'e3', type: 'entrenamiento', title: 'Entrenamiento físico-técnico',
    date: dateOnly(6), time: '18:30', endTime: '20:00',
    location: 'Cancha Municipal - Sector Norte',
    description: 'Trabajo de fuerza explosiva y finalización.',
    status: 'programado',
  },
  {
    id: 'e4', type: 'partido', title: 'Partido vs Águilas FC',
    date: dateOnly(11), time: '16:00', endTime: '18:00',
    location: 'Cancha Águilas FC',
    opponent: 'Águilas FC', isHome: false,
    description: 'Jornada 13 del torneo clausura.',
    status: 'programado',
  },
  {
    id: 'e5', type: 'reunion', title: 'Reunión de cuerpo técnico',
    date: dateOnly(2), time: '20:00', endTime: '21:00',
    location: 'Sala virtual (Google Meet)',
    description: 'Análisis del próximo rival y definición de convocatoria.',
    status: 'programado',
  },

  // === Partidos pasados con resultados ===
  {
    id: 'e6', type: 'partido', title: 'Partido vs Leones Unidos',
    date: dateOnly(-3), time: '15:00', endTime: '17:00',
    location: 'Estadio La Esperanza',
    opponent: 'Leones Unidos', isHome: true,
    status: 'completado', homeScore: 3, awayScore: 1, formation: '4-3-3',
  },
  {
    id: 'e7', type: 'partido', title: 'Partido vs Lobos de la Sabana',
    date: dateOnly(-10), time: '16:00', endTime: '18:00',
    location: 'Cancha Lobos',
    opponent: 'Lobos de la Sabana', isHome: false,
    status: 'completado', homeScore: 2, awayScore: 0, formation: '4-4-2',
  },
  {
    id: 'e8', type: 'partido', title: 'Partido vs Pumas FC',
    date: dateOnly(-17), time: '15:00', endTime: '17:00',
    location: 'Estadio La Esperanza',
    opponent: 'Pumas FC', isHome: true,
    status: 'completado', homeScore: 1, awayScore: 1, formation: '4-3-3',
  },
  {
    id: 'e9', type: 'partido', title: 'Partido vs Cóndores',
    date: dateOnly(-24), time: '15:00', endTime: '17:00',
    location: 'Cancha Cóndores',
    opponent: 'Cóndores', isHome: false,
    status: 'completado', homeScore: 0, awayScore: 2, formation: '4-4-2',
  },

  // Entrenamientos pasados
  {
    id: 'e10', type: 'entrenamiento', title: 'Entrenamiento - Posesión',
    date: dateOnly(-1), time: '18:30', endTime: '20:00',
    location: 'Cancha Municipal - Sector Norte',
    status: 'completado',
  },
  {
    id: 'e11', type: 'entrenamiento', title: 'Entrenamiento - Finalización',
    date: dateOnly(-5), time: '18:30', endTime: '20:00',
    location: 'Cancha Municipal - Sector Norte',
    status: 'completado',
  },
  {
    id: 'e12', type: 'torneo', title: 'Torneo Clausura 2026',
    date: dateOnly(-30), time: '00:00',
    location: 'Liga Municipal',
    description: 'Inicio del torneo clausura. 8 equipos participantes.',
    status: 'programado',
  },
]

// Asistencias (solo para eventos próximos)
export const seedAttendances: Attendance[] = [
  // Para e1 (entrenamiento mañana)
  { eventId: 'e1', playerId: 'p2', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e1', playerId: 'p3', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e1', playerId: 'p5', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e1', playerId: 'p6', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e1', playerId: 'p7', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e1', playerId: 'p8', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e1', playerId: 'p9', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e1', playerId: 'p10', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e1', playerId: 'p11', status: 'tal_vez', updatedAt: dateOffset(0) },
  { eventId: 'e1', playerId: 'p15', status: 'no_asistire', updatedAt: dateOffset(0) },
  { eventId: 'e1', playerId: 'p16', status: 'asistire', updatedAt: dateOffset(0) },
  // Para e2 (partido vs Tigres)
  { eventId: 'e2', playerId: 'p2', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e2', playerId: 'p3', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e2', playerId: 'p5', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e2', playerId: 'p6', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e2', playerId: 'p7', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e2', playerId: 'p8', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e2', playerId: 'p9', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e2', playerId: 'p10', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e2', playerId: 'p11', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e2', playerId: 'p13', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e2', playerId: 'p16', status: 'tal_vez', updatedAt: dateOffset(0) },
  { eventId: 'e2', playerId: 'p17', status: 'asistire', updatedAt: dateOffset(0) },
  { eventId: 'e2', playerId: 'p18', status: 'asistire', updatedAt: dateOffset(0) },
]

// Convocatoria para el próximo partido (e2)
export const seedCallups: Callup[] = [
  {
    eventId: 'e2',
    calledUpPlayerIds: ['p1','p2','p3','p5','p6','p7','p8','p9','p10','p11','p13','p16','p17','p18'],
    startingIds: ['p1','p2','p3','p5','p6','p7','p8','p10','p9','p11','p13'],
    substituteIds: ['p16','p17','p18'],
    captainId: 'p8',
    formation: '4-3-3',
    positions: {
      p1: 'POR',
      p2: 'LD',
      p3: 'DFC',
      p5: 'DFC',
      p13: 'LI',
      p6: 'MCD',
      p8: 'MC',
      p10: 'MCO',
      p7: 'ED',
      p9: 'DC',
      p11: 'EI',
    },
  },
]

// Estadísticas de los últimos partidos
export const seedMatchStats: MatchStat[] = [
  // e6: Leones Unidos 3-1 (ganamos) - figura: Camilo Rojas (p9) hat-trick
  { id: 's1', eventId: 'e6', playerId: 'p9', goals: 3, assists: 0, minutesPlayed: 90, yellowCards: 0, redCards: 0, saves: 0, shots: 6, recoveries: 2, isMotm: true },
  { id: 's2', eventId: 'e6', playerId: 'p10', goals: 0, assists: 2, minutesPlayed: 90, yellowCards: 0, redCards: 0, saves: 0, shots: 3, recoveries: 4, isMotm: false },
  { id: 's3', eventId: 'e6', playerId: 'p11', goals: 0, assists: 1, minutesPlayed: 75, yellowCards: 0, redCards: 0, saves: 0, shots: 2, recoveries: 1, isMotm: false },
  { id: 's4', eventId: 'e6', playerId: 'p1', goals: 0, assists: 0, minutesPlayed: 90, yellowCards: 0, redCards: 0, saves: 5, shots: 0, recoveries: 0, isMotm: false },
  // e7: Lobos 2-0 (ganamos) - figura: Tomás Álvarez (p10)
  { id: 's5', eventId: 'e7', playerId: 'p10', goals: 1, assists: 1, minutesPlayed: 90, yellowCards: 0, redCards: 0, saves: 0, shots: 4, recoveries: 6, isMotm: true },
  { id: 's6', eventId: 'e7', playerId: 'p16', goals: 1, assists: 0, minutesPlayed: 65, yellowCards: 0, redCards: 0, saves: 0, shots: 3, recoveries: 1, isMotm: false },
  { id: 's7', eventId: 'e7', playerId: 'p9', goals: 0, assists: 1, minutesPlayed: 90, yellowCards: 1, redCards: 0, saves: 0, shots: 3, recoveries: 2, isMotm: false },
  // e8: Pumas 1-1 (empate)
  { id: 's8', eventId: 'e8', playerId: 'p9', goals: 1, assists: 0, minutesPlayed: 90, yellowCards: 0, redCards: 0, saves: 0, shots: 4, recoveries: 1, isMotm: true },
  { id: 's9', eventId: 'e8', playerId: 'p8', goals: 0, assists: 1, minutesPlayed: 90, yellowCards: 1, redCards: 0, saves: 0, shots: 2, recoveries: 5, isMotm: false },
]

// Anuncios
export const seedAnnouncements: Announcement[] = [
  {
    id: 'a1',
    title: 'Convocatoria vs Tigres del Norte publicada',
    content: 'Ya está disponible la convocatoria para el partido del próximo sábado. Revisar la sección de Convocatorias. Llegar al estadio 1 hora antes del inicio. Traer dos uniformes.',
    author: 'Carlos Mendoza', authorRole: 'entrenador',
    date: dateOffset(-1), pinned: true, readBy: ['p1','p2','p3','p5','p6'],
    category: 'convocatoria',
  },
  {
    id: 'a2',
    title: 'Recordatorio: pago de mensualidad',
    content: 'Estimados jugadores, recuerden estar al día con la mensualidad de $40.000 antes del partido del sábado. El administrador estará en cancha para recibir los pagos.',
    author: 'Carlos Mendoza', authorRole: 'entrenador',
    date: dateOffset(-2), pinned: true, readBy: ['p1','p2','p3'],
    category: 'general',
  },
  {
    id: 'a3',
    title: 'Trabajo táctico mañana: 4-3-3',
    content: 'Mañana en el entrenamiento trabajaremos la salida con balón desde el fondo en formación 4-3-3. Repasar los movimientos de los mediocampistas. Es crucial para el partido del sábado.',
    author: 'Carlos Mendoza', authorRole: 'entrenador',
    date: dateOffset(0), pinned: false, readBy: [],
    category: 'general',
  },
  {
    id: 'a4',
    title: 'Felicitaciones por la victoria 3-1',
    content: 'Excelente partido ante Leones Unidos. Tres goles, conducta ejemplar y un gran trabajo en equipo. A seguir con esta intensidad. ¡Vamos Halcones!',
    author: 'Carlos Mendoza', authorRole: 'entrenador',
    date: dateOffset(-3), pinned: false, readBy: ['p1','p2','p5','p6','p7','p8','p9','p10'],
    category: 'general',
  },
]

// Tabla de posiciones del torneo clausura
export const seedStandings: StandingRow[] = [
  { teamName: 'Tigres del Norte', played: 11, won: 8, drawn: 2, lost: 1, goalsFor: 24, goalsAgainst: 9, points: 26 },
  { teamName: 'Los Halcones FC', played: 11, won: 7, drawn: 2, lost: 2, goalsFor: 21, goalsAgainst: 12, points: 23, isOurTeam: true },
  { teamName: 'Águilas FC', played: 11, won: 6, drawn: 3, lost: 2, goalsFor: 19, goalsAgainst: 14, points: 21 },
  { teamName: 'Pumas FC', played: 11, won: 5, drawn: 4, lost: 2, goalsFor: 16, goalsAgainst: 13, points: 19 },
  { teamName: 'Leones Unidos', played: 11, won: 4, drawn: 2, lost: 5, goalsFor: 14, goalsAgainst: 18, points: 14 },
  { teamName: 'Lobos de la Sabana', played: 11, won: 3, drawn: 3, lost: 5, goalsFor: 12, goalsAgainst: 19, points: 12 },
  { teamName: 'Cóndores', played: 11, won: 2, drawn: 4, lost: 5, goalsFor: 11, goalsAgainst: 16, points: 10 },
  { teamName: 'Toros del Valle', played: 11, won: 1, drawn: 1, lost: 9, goalsFor: 8, goalsAgainst: 24, points: 4 },
]
