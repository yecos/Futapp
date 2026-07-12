import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface TestResult {
  label: string
  url: string
  success: boolean
  error: string | null
  tablesCount?: number
  userCount?: number
}

/**
 * Endpoint que prueba automáticamente todas las combinaciones posibles
 * de connection strings de Supabase para encontrar la que funciona.
 */
export async function GET() {
  const PROJECT_REF = 'pcazczdxcyiwcmstidxw'
  const DB_PASSWORD = 'Arquitectura11*'
  const DB_PASSWORD_ENC = 'Arquitectura11%2A'

  // Todas las regiones posibles de Supabase
  const regions = [
    'aws-0-us-west-1',
    'aws-0-us-east-1',
    'aws-0-us-east-2',
    'aws-0-eu-west-1',
    'aws-0-eu-central-1',
    'aws-0-ap-southeast-1',
    'aws-0-ap-northeast-1',
    'aws-0-ap-southeast-2',
    'aws-0-sa-east-1',
  ]

  // Formatos de usuario posibles
  const userFormats = [
    `postgres.${PROJECT_REF}`,
    `postgres`,
  ]

  // Tipos de conexión
  const connectionTypes = [
    { label: 'session-pooler-5432', port: '5432', usePooler: true, pgbouncer: true },
    { label: 'transaction-pooler-6543', port: '6543', usePooler: true, pgbouncer: true },
    { label: 'direct-5432', port: '5432', usePooler: false, pgbouncer: false },
  ]

  // Passwords (con y sin URL encode)
  const passwords = [
    { label: 'plain', value: DB_PASSWORD },
    { label: 'encoded', value: DB_PASSWORD_ENC },
  ]

  const results: TestResult[] = []

  // Probar todas las combinaciones
  for (const region of regions) {
    for (const userFormat of userFormats) {
      for (const connType of connectionTypes) {
        for (const pw of passwords) {
          const host = connType.usePooler
            ? `${region}.pooler.supabase.com`
            : `db.${PROJECT_REF}.supabase.co`

          const query = connType.pgbouncer
            ? '?pgbouncer=true&connection_limit=1'
            : ''

          const url = `postgresql://${userFormat}:${pw.value}@${host}:${connType.port}/postgres${query}`

          const label = `${region} | ${userFormat} | ${connType.label} | pw-${pw.label}`

          try {
            const prisma = new PrismaClient({
              datasources: { db: { url } },
              log: ['error'],
            })

            await prisma.$connect()
            const tables = await prisma.$queryRaw`
              SELECT table_name
              FROM information_schema.tables
              WHERE table_schema = 'public'
              ORDER BY table_name;
            `
            const userCount = await prisma.user.count().catch(() => -1)

            results.push({
              label,
              url: url.replace(pw.value, '***'),
              success: true,
              error: null,
              tablesCount: (tables as any[]).length,
              userCount: userCount as number,
            })

            await prisma.$disconnect()
            // Si encontramos una que funciona, salir del loop
            return NextResponse.json({
              success: true,
              workingConnection: {
                label,
                url: url.replace(pw.value, '***'),
                urlWithPassword: url,
                tablesCount: (tables as any[]).length,
                userCount,
              },
              allResults: results,
            })
          } catch (error: any) {
            results.push({
              label,
              url: url.replace(pw.value, '***'),
              success: false,
              error: error.message?.slice(0, 200) || 'Unknown error',
            })
          }
        }
      }
    }
  }

  return NextResponse.json({
    success: false,
    message: 'No se encontró ninguna combinación que funcione',
    allResults: results,
    totalTested: results.length,
  })
}
