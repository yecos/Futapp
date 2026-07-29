import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import { config } from 'dotenv'

// Cargar variables de entorno desde .env (necesario para tsx)
config()

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Limpiando DB...')
  await prisma.notification.deleteMany()
  await prisma.paymentReceipt.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.inviteToken.deleteMany()
  await prisma.announcementRead.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.matchStat.deleteMany()
  await prisma.callup.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.standing.deleteMany()
  await prisma.player.deleteMany()
  await prisma.teamMembership.deleteMany()
  await prisma.team.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  console.log('👑 Creando usuario admin demo...')
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@futapp.demo',
      name: 'Carlos Mendoza',
      emailVerified: new Date(),
    },
  })

  console.log('🏟️ Creando equipo...')
  const team = await prisma.team.create({
    data: {
      name: 'Los Halcones FC',
      shortName: 'HFC',
      category: 'Senior Amateur - Liga Municipal',
      coachName: 'Carlos Mendoza',
      primaryColor: '#16a34a',
      foundedYear: 2015,
      bankName: 'Bancolombia',
      accountType: 'Ahorros',
      accountNumber: '001-123456-78',
      accountHolder: 'Los Halcones FC',
      paymentInstructions: 'Transferir y subir comprobante en la app.',
      onboardingCompleted: true,
      isActive: true,
    },
  })

  console.log('🔐 Creando membership admin...')
  await prisma.teamMembership.create({
    data: {
      userId: adminUser.id,
      teamId: team.id,
      role: 'ADMIN',
      status: 'ACTIVO',
      joinedAt: new Date(),
    },
  })

  console.log('👥 Creando 18 jugadores...')
  const players = [
    { firstName: 'Andrés', lastName: 'Gómez', jerseyNumber: 1, position: 'PORTERO', foot: 'DIESTRO', age: 28, height: 184, weight: 80 },
    { firstName: 'Sebastián', lastName: 'Ríos', jerseyNumber: 2, position: 'DEFENSA', foot: 'DIESTRO', age: 26, height: 178, weight: 74 },
    { firstName: 'Mateo', lastName: 'Vargas', jerseyNumber: 3, position: 'DEFENSA', foot: 'ZURDO', age: 24, height: 180, weight: 76 },
    { firstName: 'Diego', lastName: 'Torres', jerseyNumber: 4, position: 'DEFENSA', foot: 'DIESTRO', age: 30, height: 182, weight: 79 },
    { firstName: 'Felipe', lastName: 'Castro', jerseyNumber: 5, position: 'DEFENSA', foot: 'DIESTRO', age: 27, height: 186, weight: 82 },
    { firstName: 'Juan', lastName: 'Herrera', jerseyNumber: 6, position: 'MEDIOCAMPISTA', foot: 'DIESTRO', age: 25, height: 175, weight: 70 },
    { firstName: 'Santiago', lastName: 'Ortega', jerseyNumber: 7, position: 'MEDIOCAMPISTA', foot: 'ZURDO', age: 23, height: 172, weight: 68 },
    { firstName: 'Nicolás', lastName: 'Mejía', jerseyNumber: 8, position: 'MEDIOCAMPISTA', foot: 'DIESTRO', age: 28, height: 177, weight: 72 },
    { firstName: 'Camilo', lastName: 'Rojas', jerseyNumber: 9, position: 'DELANTERO', foot: 'DIESTRO', age: 26, height: 180, weight: 75 },
    { firstName: 'Tomás', lastName: 'Álvarez', jerseyNumber: 10, position: 'MEDIOCAMPISTA', foot: 'ZURDO', age: 27, height: 174, weight: 69 },
    { firstName: 'Samuel', lastName: 'Quintero', jerseyNumber: 11, position: 'DELANTERO', foot: 'DIESTRO', age: 22, height: 176, weight: 71 },
    { firstName: 'David', lastName: 'Mora', jerseyNumber: 12, position: 'PORTERO', foot: 'DIESTRO', age: 24, height: 181, weight: 78 },
    { firstName: 'Andrés', lastName: 'Salazar', jerseyNumber: 13, position: 'DEFENSA', foot: 'DIESTRO', age: 29, height: 179, weight: 75 },
    { firstName: 'Lucas', lastName: 'Cardona', jerseyNumber: 14, position: 'MEDIOCAMPISTA', foot: 'AMBIDIESTRO', age: 21, height: 173, weight: 68 },
    { firstName: 'Daniel', lastName: 'Patiño', jerseyNumber: 15, position: 'DEFENSA', foot: 'ZURDO', age: 26, height: 183, weight: 80 },
    { firstName: 'Pablo', lastName: 'Navarro', jerseyNumber: 16, position: 'DELANTERO', foot: 'DIESTRO', age: 25, height: 178, weight: 73 },
    { firstName: 'Mateo', lastName: 'Lozano', jerseyNumber: 17, position: 'MEDIOCAMPISTA', foot: 'DIESTRO', age: 24, height: 176, weight: 71 },
    { firstName: 'Kevin', lastName: 'Ramírez', jerseyNumber: 18, position: 'DELANTERO', foot: 'ZURDO', age: 23, height: 177, weight: 72 },
  ]

  const createdPlayers = []
  for (const p of players) {
    const player = await prisma.player.create({
      data: {
        teamId: team.id,
        firstName: p.firstName,
        lastName: p.lastName,
        fullName: `${p.firstName} ${p.lastName}`,
        jerseyNumber: p.jerseyNumber,
        primaryPosition: p.position as any,
        dominantFoot: p.foot as any,
        age: p.age,
        height: p.height,
        weight: p.weight,
        status: p.jerseyNumber === 4 ? 'SUSPENDIDO' : p.jerseyNumber === 15 ? 'LESIONADO' : 'DISPONIBLE',
        matchesPlayed: 14 + (p.jerseyNumber % 3),
        goals: p.position === 'DELANTERO' ? 3 + (p.jerseyNumber % 8) : (p.jerseyNumber % 3),
        assists: 1 + (p.jerseyNumber % 6),
        yellowCards: p.jerseyNumber % 5,
        redCards: p.jerseyNumber === 4 ? 1 : 0,
        trainingsAttended: 20 + (p.jerseyNumber % 6),
        trainingsTotal: 26,
      },
    })
    createdPlayers.push(player)
  }

  console.log('📅 Creando eventos...')
  const now = new Date()
  const events = [
    {
      type: 'ENTRENAMIENTO', title: 'Entrenamiento táctico',
      date: new Date(now.getTime() + 1 * 86400000), time: '18:30',
      location: 'Cancha Municipal - Sector Norte',
      description: 'Trabajo de posesión y transiciones rápidas.',
    },
    {
      type: 'PARTIDO', title: 'Partido vs Tigres del Norte',
      date: new Date(now.getTime() + 4 * 86400000), time: '15:00',
      location: 'Estadio La Esperanza',
      opponent: 'Tigres del Norte', isHome: true,
    },
    {
      type: 'REUNION', title: 'Reunión de cuerpo técnico',
      date: new Date(now.getTime() + 2 * 86400000), time: '20:00',
      location: 'Sala virtual',
    },
    {
      type: 'PARTIDO', title: 'Partido vs Leones Unidos',
      date: new Date(now.getTime() - 3 * 86400000), time: '15:00',
      location: 'Estadio La Esperanza',
      opponent: 'Leones Unidos', isHome: true,
      status: 'COMPLETADO', homeScore: 3, awayScore: 1, formation: '4-3-3',
    },
    {
      type: 'PARTIDO', title: 'Partido vs Lobos de la Sabana',
      date: new Date(now.getTime() - 10 * 86400000), time: '16:00',
      location: 'Cancha Lobos',
      opponent: 'Lobos de la Sabana', isHome: false,
      status: 'COMPLETADO', homeScore: 2, awayScore: 0, formation: '4-4-2',
    },
  ]

  for (const e of events) {
    const [year, month, day] = e.date.toISOString().split('T')[0].split('-').map(Number)
    const [hour, minute] = e.time.split(':').map(Number)
    const dateObj = new Date(year, month - 1, day, hour, minute, 0, 0)
    await prisma.event.create({
      data: {
        teamId: team.id,
        type: e.type as any,
        title: e.title,
        description: (e as any).description || null,
        date: dateObj,
        location: e.location,
        opponent: e.opponent || null,
        isHome: (e as any).isHome ?? null,
        status: (e as any).status || 'PROGRAMADO',
        homeScore: (e as any).homeScore || null,
        awayScore: (e as any).awayScore || null,
        formation: (e as any).formation || null,
        createdBy: adminUser.id,
      },
    })
  }

  console.log('💰 Creando cobros demo...')
  // Mensualidad del mes actual
  const monthlyPayment = await prisma.payment.create({
    data: {
      teamId: team.id,
      title: `Mensualidad ${now.toLocaleDateString('es-CO', { month: 'long' })} ${now.getFullYear()}`,
      description: 'Mensualidad del equipo para el mes en curso.',
      type: 'MENSUALIDAD',
      amount: 40000,
      dueDate: new Date(now.getFullYear(), now.getMonth(), 15),
      recurrence: 'MENSUAL',
      appliesTo: ['ALL'],
      status: 'PENDIENTE',
      createdBy: adminUser.id,
    },
  })

  // Arbitraje último partido
  const arbitrationPayment = await prisma.payment.create({
    data: {
      teamId: team.id,
      title: 'Arbitraje vs Leones Unidos',
      description: 'Pago del árbitro del último partido.',
      type: 'ARBITRAJE',
      amount: 15000,
      dueDate: new Date(now.getTime() - 2 * 86400000),
      recurrence: 'UNICO',
      appliesTo: ['ALL'],
      status: 'PENDIENTE',
      createdBy: adminUser.id,
    },
  })

  console.log('📊 Creando tabla de posiciones...')
  const standings = [
    { teamName: 'Tigres del Norte', played: 11, won: 8, drawn: 2, lost: 1, goalsFor: 24, goalsAgainst: 9, points: 26 },
    { teamName: 'Los Halcones FC', played: 11, won: 7, drawn: 2, lost: 2, goalsFor: 21, goalsAgainst: 12, points: 23, isOurTeam: true },
    { teamName: 'Águilas FC', played: 11, won: 6, drawn: 3, lost: 2, goalsFor: 19, goalsAgainst: 14, points: 21 },
    { teamName: 'Pumas FC', played: 11, won: 5, drawn: 4, lost: 2, goalsFor: 16, goalsAgainst: 13, points: 19 },
    { teamName: 'Leones Unidos', played: 11, won: 4, drawn: 2, lost: 5, goalsFor: 14, goalsAgainst: 18, points: 14 },
    { teamName: 'Lobos de la Sabana', played: 11, won: 3, drawn: 3, lost: 5, goalsFor: 12, goalsAgainst: 19, points: 12 },
    { teamName: 'Cóndores', played: 11, won: 2, drawn: 4, lost: 5, goalsFor: 11, goalsAgainst: 16, points: 10 },
    { teamName: 'Toros del Valle', played: 11, won: 1, drawn: 1, lost: 9, goalsFor: 8, goalsAgainst: 24, points: 4 },
  ]
  for (const s of standings) {
    await prisma.standing.create({
      data: {
        teamId: team.id,
        tournamentName: 'Torneo Clausura 2026',
        teamName: s.teamName,
        isOurTeam: s.isOurTeam || false,
        played: s.played, won: s.won, drawn: s.drawn, lost: s.lost,
        goalsFor: s.goalsFor, goalsAgainst: s.goalsAgainst,
        points: s.points,
      },
    })
  }

  console.log('🔔 Creando avisos...')
  await prisma.announcement.createMany({
    data: [
      {
        teamId: team.id,
        title: 'Convocatoria vs Tigres del Norte publicada',
        content: 'Ya está disponible la convocatoria para el partido del próximo sábado. Revisar la sección de Convocatorias.',
        category: 'CONVOCATORIA',
        authorId: adminUser.id,
        authorRole: 'ENTRENADOR',
        pinned: true,
        publishedAt: new Date(now.getTime() - 86400000),
      },
      {
        teamId: team.id,
        title: 'Recordatorio: pago de mensualidad',
        content: 'Recuerden estar al día con la mensualidad antes del partido del sábado. Pago disponible en la app.',
        category: 'PAGO',
        authorId: adminUser.id,
        authorRole: 'ADMIN',
        pinned: true,
        publishedAt: new Date(now.getTime() - 2 * 86400000),
      },
      {
        teamId: team.id,
        title: 'Trabajo táctico mañana: 4-3-3',
        content: 'Mañana en el entrenamiento trabajaremos la salida con balón desde el fondo en formación 4-3-3.',
        category: 'GENERAL',
        authorId: adminUser.id,
        authorRole: 'ENTRENADOR',
        pinned: false,
        publishedAt: new Date(),
      },
    ],
  })

  console.log('\n✅ Seed completado!\n')
  console.log(`📊 Resumen:`)
  console.log(`   - Usuarios: 1 (admin)`)
  console.log(`   - Equipos: 1`)
  console.log(`   - Jugadores: ${createdPlayers.length}`)
  console.log(`   - Eventos: ${events.length}`)
  console.log(`   - Cobros: 2`)
  console.log(`   - Tabla posiciones: ${standings.length}`)
  console.log(`   - Avisos: 3`)
  console.log(`\n🔑 Login admin:`)
  console.log(`   Email: admin@futapp.demo`)
  console.log(`   (Sin contraseña - es un user demo sin Google real)`)
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
