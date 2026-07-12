import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  let pg: any
  try {
    pg = await import('pg')
  } catch (e: any) {
    return NextResponse.json({ error: 'pg not available', message: e.message })
  }

  const { Client } = pg
  const PROJECT_REF = 'pcazczdxcyiwcmstidxw'
  const PW = 'Arquitectura11*'

  const urls = [
    `postgresql://postgres.${PROJECT_REF}:${PW}@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1`,
    `postgresql://postgres.${PROJECT_REF}:${PW}@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`,
    `postgresql://postgres:${PW}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
  ]

  const results = []

  for (const url of urls) {
    const client = new Client({
      connectionString: url,
      connectionTimeoutMillis: 5000,
      ssl: { rejectUnauthorized: false },
    })

    try {
      await client.connect()
      const r = await client.query('SELECT count(*) FROM information_schema.tables WHERE table_schema = $1', ['public'])
      results.push({
        url: url.replace(/:[^:@]+@/, ':***@'),
        success: true,
        tablesCount: r.rows[0].count,
      })
      await client.end()
    } catch (e: any) {
      results.push({
        url: url.replace(/:[^:@]+@/, ':***@'),
        success: false,
        error: e.message.slice(0, 200),
      })
      try { await client.end() } catch {}
    }
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() })
}
