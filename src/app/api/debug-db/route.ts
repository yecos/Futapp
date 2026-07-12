import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    env: {
      hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
      hasPostgresUrlNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
      hasNextauthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextauthUrl: process.env.NEXTAUTH_URL,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      postgresPrismaUrlPreview: process.env.POSTGRES_PRISMA_URL?.substring(0, 50),
      nodeEnv: process.env.NODE_ENV,
    },
    db: { status: 'pending', error: null as string | null, tables: [] as string[] },
  }

  try {
    const prisma = new PrismaClient()
    // Probar conexión
    await prisma.$connect()

    // Listar tablas
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `
    results.db.tables = (tables as any[]).map((t) => t.table_name)
    results.db.status = 'connected'

    // Contar usuarios
    const userCount = await prisma.user.count()
    results.db.userCount = userCount

    await prisma.$disconnect()
  } catch (error: any) {
    results.db.status = 'error'
    results.db.error = error.message
  }

  return NextResponse.json(results, { status: 200 })
}
