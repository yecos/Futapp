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

    // Timeout de 8 segundos por intento
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
  const DB_PASSWORD = 'Arquitectura11*'
  const DB_PASSWORD_ENC = 'Arquitectura11%2A'

  // Solo las regiones más probables
  const regions = [
    'aws-0-us-west-1',
    'aws-0-us-east-1',
    'aws-0-eu-west-1',
    'aws-0-ap-southeast-1',
    'aws-0-sa-east-1',
  ]

  // Solo los formatos más probables
  const tests: Promise<TestResult>[] = []

  for (const region of regions) {
    // Session pooler con usuario postgres.project_ref (formato nuevo)
    const url1 = `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD_ENC}@${region}.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1`
    tests.push(tryConnection(url1, `${region} | postgres.ref | session-5432`, `${region}.pooler.supabase.com`, `postgres.${PROJECT_REF}`, '5432'))

    // Transaction pooler con usuario postgres.project_ref
    const url2 = `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD_ENC}@${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
    tests.push(tryConnection(url2, `${region} | postgres.ref | tx-6543`, `${region}.pooler.supabase.com`, `postgres.${PROJECT_REF}`, '6543'))

    // Direct connection con usuario postgres simple
    const url3 = `postgresql://postgres:${DB_PASSWORD_ENC}@db.${PROJECT_REF}.supabase.co:5432/postgres`
    if (region === 'aws-0-us-west-1') {
      tests.push(tryConnection(url3, `direct | postgres | 5432`, `db.${PROJECT_REF}.supabase.co`, 'postgres', '5432'))
    }
  }

  // Ejecutar TODAS en paralelo
  const results = await Promise.all(tests)

  // Encontrar la primera que funcionó
  const working = results.find((r) => r.success)

  return NextResponse.json({
    success: !!working,
    workingConnection: working || null,
    allResults: results,
    totalTested: results.length,
    timestamp: new Date().toISOString(),
  })
}
