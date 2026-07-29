import { PrismaClient } from '@prisma/client'

// URL que me pasó el usuario (pooler)
const POOLED_URL = 'postgresql://neondb_owner:npg_PAhDisac4B1H@ep-calm-waterfall-avcat17v-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true&connect_timeout=15'

// URL directa (sin -pooler) para migraciones
const DIRECT_URL = 'postgresql://neondb_owner:npg_PAhDisac4B1H@ep-calm-waterfall-avcat17v.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

console.log('Testing pooled connection (DATABASE_URL)...')
try {
  const prisma = new PrismaClient({ datasources: { db: { url: POOLED_URL } } })
  const result = await prisma.$queryRaw`SELECT current_user, current_database(), now()`
  console.log('  ✓ Pooled connection OK:', JSON.stringify(result))
  await prisma.$disconnect()
} catch (e) {
  console.log('  ✗ Pooled failed:', String(e.message).split('\n').slice(0, 4).join(' | '))
}

console.log('\nTesting direct connection (DIRECT_URL)...')
try {
  const prisma = new PrismaClient({ datasources: { db: { url: DIRECT_URL } } })
  const result = await prisma.$queryRaw`SELECT current_user, current_database(), now()`
  console.log('  ✓ Direct connection OK:', JSON.stringify(result))
  await prisma.$disconnect()
} catch (e) {
  console.log('  ✗ Direct failed:', String(e.message).split('\n').slice(0, 4).join(' | '))
}
