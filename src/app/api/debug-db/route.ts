import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface TestResult {
  label: string
  url: string
  success: boolean
  error: string | null
  result?: any
}

async function tryConnection(url: string, label: string): Promise<TestResult> {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url } },
    })

    const timeoutPromise = new Promise<TestResult>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout 8s')), 8000)
    )

    const connectPromise = (async () => {
      await prisma.$connect()
      const result = await prisma.$queryRaw`SELECT count(*)::int as c FROM information_schema.tables WHERE table_schema = 'public'`
      const count = (result as any[])[0]?.c ?? 0
      await prisma.$disconnect()
      return {
        label,
        url: url.replace(/:[^:@]+@/, ':***@'),
        success: true,
        error: null,
        result: { tablesCount: count },
      } as TestResult
    })()

    return await Promise.race([connectPromise, timeoutPromise])
  } catch (error: any) {
    return {
      label,
      url: url.replace(/:[^:@]+@/, ':***@'),
      success: false,
      error: error.message?.slice(0, 200) || 'Unknown error',
    }
  }
}

export async function GET() {
  const PROJECT_REF = 'pcazczdxcyiwcmstidxw'
  const PW = 'Arquitectura11%2A'
  const HOST = 'aws-0-us-west-2.pooler.supabase.com'

  const tests: Promise<TestResult>[] = []

  // 1. Con SSL require
  tests.push(tryConnection(
    `postgresql://postgres.${PROJECT_REF}:${PW}@${HOST}:5432/postgres?pgbouncer=true&connection_limit=1&sslmode=require`,
    'session-pooler-5432-ssl'
  ))
  tests.push(tryConnection(
    `postgresql://postgres.${PROJECT_REF}:${PW}@${HOST}:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require`,
    'tx-pooler-6543-ssl'
  ))

  // 2. Sin pgbouncer pero con SSL
  tests.push(tryConnection(
    `postgresql://postgres.${PROJECT_REF}:${PW}@${HOST}:5432/postgres?sslmode=require`,
    'no-pgbouncer-5432-ssl'
  ))
  tests.push(tryConnection(
    `postgresql://postgres.${PROJECT_REF}:${PW}@${HOST}:6543/postgres?sslmode=require`,
    'no-pgbouncer-6543-ssl'
  ))

  // 3. Direct con SSL
  tests.push(tryConnection(
    `postgresql://postgres:${PW}@db.${PROJECT_REF}.supabase.co:5432/postgres?sslmode=require`,
    'direct-5432-ssl'
  ))

  // 4. Con sslmode=no-verify (a veces necesario)
  tests.push(tryConnection(
    `postgresql://postgres.${PROJECT_REF}:${PW}@${HOST}:5432/postgres?pgbouncer=true&connection_limit=1&sslmode=no-verify`,
    'session-pooler-5432-ssl-noverify'
  ))
  tests.push(tryConnection(
    `postgresql://postgres.${PROJECT_REF}:${PW}@${HOST}:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=no-verify`,
    'tx-pooler-6543-ssl-noverify'
  ))

  const results = await Promise.all(tests)
  const working = results.filter((r) => r.success)

  return NextResponse.json({
    success: working.length > 0,
    workingConnections: working,
    allResults: results,
    timestamp: new Date().toISOString(),
  })
}
