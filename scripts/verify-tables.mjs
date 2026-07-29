import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📋 Verificando tablas creadas en Neon...\n')

  const tables = await prisma.$queryRaw`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `

  console.log(`✅ ${tables.length} tablas creadas:`)
  for (const t of tables) {
    console.log(`   - ${t.tablename}`)
  }

  console.log('\n📊 Conteo de registros por tabla:')
  const models = [
    'User', 'Account', 'Session', 'VerificationToken',
    'Team', 'TeamMembership',
    'Player', 'Event', 'Attendance', 'Callup', 'MatchStat',
    'Announcement', 'AnnouncementRead', 'Standing',
    'Payment', 'PaymentReceipt', 'Notification',
    'InviteToken', 'CheckIn', 'Absence',
  ]

  for (const model of models) {
    try {
      const count = await (prisma[model.toLowerCase().charAt(0) + model.slice(1)] || prisma[model])?.count?.() ?? 0
      console.log(`   ${model}: ${count}`)
    } catch (e) {
      console.log(`   ${model}: (error)`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
