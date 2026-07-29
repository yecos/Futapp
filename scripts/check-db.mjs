import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config()

const prisma = new PrismaClient()

async function main() {
  console.log('📊 Estado actual de la base de datos Neon:\n')

  const [users, teams, players, events, payments, memberships] = await Promise.all([
    prisma.user.count(),
    prisma.team.count(),
    prisma.player.count(),
    prisma.event.count(),
    prisma.payment.count(),
    prisma.teamMembership.count(),
  ])

  console.log(`  👤 Users:        ${users}`)
  console.log(`  🏟️ Teams:        ${teams}`)
  console.log(`  👥 Players:      ${players}`)
  console.log(`  📅 Events:       ${events}`)
  console.log(`  💰 Payments:     ${payments}`)
  console.log(`  🔐 Memberships:  ${memberships}`)

  console.log('\n🏟️ Equipo configurado:')
  const team = await prisma.team.findFirst({
    include: { _count: { select: { players: true, memberships: true, events: true } } },
  })
  if (team) {
    console.log(`   - Nombre: ${team.name} (${team.shortName})`)
    console.log(`   - Onboarding: ${team.onboardingCompleted ? '✅ Completado' : '❌ Pendiente'}`)
    console.log(`   - Cuenta: ${team.bankName} ${team.accountType} ${team.accountNumber}`)
    console.log(`   - Jugadores: ${team._count.players}`)
    console.log(`   - Miembros: ${team._count.memberships}`)
    console.log(`   - Eventos: ${team._count.events}`)
  }

  console.log('\n👑 Admin user:')
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@futapp.demo' },
  })
  if (admin) {
    console.log(`   - Email: ${admin.email}`)
    console.log(`   - Name:  ${admin.name}`)
    console.log(`   - ID:    ${admin.id}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
