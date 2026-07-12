import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface TestResult {
  label: string
  host: string
  user: string
  port: string
  success: boolean
  error: string | null
}

async function tryConnection(url: string, label: string, host: string, user: string, port: string): Promise<TestResult> {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url } },
    })

    const timeoutPromise = new Promise<TestResult>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout 8s')), 8000)
    )

    const connectPromise = (async () => {
      await prisma.$connect()
      const tables = await prisma.$queryRaw`SELECT count(*)::int as c FROM information_schema.tables WHERE table_schema = 'public'`
      const count = (tables as any[])[0]?.c ?? 0
      await prisma.$disconnect()
      return {
        label, host, user, port,
        success: true,
        error: null,
        tablesCount: count,
      } as TestResult
    })()

    return await Promise.race([connectPromise, timeoutPromise])
  } catch (error: any) {
    return {
      label, host, user, port,
      success: false,
      error: error.message?.slice(0, 150) || 'Unknown error',
    }
  }
}

export async function GET() {
  const PROJECT_REF = 'pcazczdxcyiwcmstidxw'
  const DB_PASSWORD = 'Arquitectura11%2A'

  const tests: Promise<TestResult>[] = []

  // Formatos de host NUEVOS y VIEJOS de Supabase
  const hostFormats = [
    // Formato nuevo (sin aws-0- prefix)
    { host: `us-west-1.pooler.supabase.com`, label: 'new-us-west-1' },
    { host: `us-east-1.pooler.supabase.com`, label: 'new-us-east-1' },
    { host: `eu-west-1.pooler.supabase.com`, label: 'new-eu-west-1' },
    // Formato viejo (con aws-0- prefix)
    { host: `aws-0-us-west-1.pooler.supabase.com`, label: 'old-aws-0-us-west-1' },
    // Project-specific
    { host: `${PROJECT_REF}.pooler.supabase.com`, label: 'project-specific' },
    // Direct con puerto 6543
    { host: `db.${PROJECT_REF}.supabase.co`, label: 'direct-with-6543' },
  ]

  const userFormats = [
    `postgres.${PROJECT_REF}`,
    `postgres`,
  ]

  for (const hostFormat of hostFormats) {
    for (const userFormat of userFormats) {
      // Puerto 5432
      const port5432 = hostFormat.label.includes('direct') ? '5432' : '5432'
      const url5432 = `postgresql://${userFormat}:${DB_PASSWORD}@${hostFormat.host}:5432/postgres?pgbouncer=true&connection_limit=1`
      tests.push(tryConnection(url5432, `${hostFormat.label} | ${userFormat} | 5432`, hostFormat.host, userFormat, '5432'))

      // Puerto 6543 (solo para pooler, no direct)
      if (!hostFormat.label.includes('direct')) {
        const url6543 = `postgresql://${userFormat}:${DB_PASSWORD}@${hostFormat.host}:6543/postgres?pgbouncer=true&connection_limit=1`
        tests.push(tryConnection(url6543, `${hostFormat.label} | ${userFormat} | 6543`, hostFormat.host, userFormat, '6543'))
      } else {
        // Direct sin pgbouncer
        const urlDirect = `postgresql://${userFormat}:${DB_PASSWORD}@${hostFormat.host}:5432/postgres`
        tests.push(tryConnection(urlDirect, `${hostFormat.label} | ${userFormat} | direct-5432-no-pgbouncer`, hostFormat.host, userFormat, '5432'))
      }
    }
  }

  // Ejecutar TODAS en paralelo
  const results = await Promise.all(tests)

  // Encontrar las que funcionaron
  const working = results.filter((r) => r.success)

  return NextResponse.json({
    success: working.length > 0,
    workingConnections: working,
    allResults: results,
    totalTested: results.length,
    timestamp: new Date().toISOString(),
  })
}
