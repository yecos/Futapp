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
  tablesCount?: number
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

  // Confirmamos que la región es us-west-2 (obtenido vía API de Supabase)
  const tests: Promise<TestResult>[] = []

  const configs = [
    // Región CORRECTA: us-west-2
    { region: 'aws-0-us-west-2', user: `postgres.${PROJECT_REF}`, port: '5432', pgbouncer: true },
    { region: 'aws-0-us-west-2', user: `postgres.${PROJECT_REF}`, port: '6543', pgbouncer: true },
    { region: 'aws-0-us-west-2', user: `postgres`, port: '5432', pgbouncer: true },
    { region: 'aws-0-us-west-2', user: `postgres`, port: '6543', pgbouncer: true },
    // Direct connection
    { region: null, user: `postgres`, port: '5432', pgbouncer: false, directHost: `db.${PROJECT_REF}.supabase.co` },
  ]

  for (const cfg of configs) {
    const host = cfg.directHost || `${cfg.region}.pooler.supabase.com`
    const query = cfg.pgbouncer ? '?pgbouncer=true&connection_limit=1' : ''
    const url = `postgresql://${cfg.user}:${DB_PASSWORD}@${host}:${cfg.port}/postgres${query}`
    const label = `${cfg.region || 'direct'} | ${cfg.user} | ${cfg.port}`

    tests.push(tryConnection(url, label, host, cfg.user, cfg.port))
  }

  const results = await Promise.all(tests)
  const working = results.filter((r) => r.success)

  return NextResponse.json({
    success: working.length > 0,
    workingConnections: working,
    allResults: results,
    timestamp: new Date().toISOString(),
  })
}
