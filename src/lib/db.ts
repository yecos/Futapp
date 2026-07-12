import { PrismaClient } from '@prisma/client'

/**
 * Prisma Client singleton para PostgreSQL (Supabase).
 * En desarrollo usa globalThis para evitar múltiples instancias
 * durante hot reload de Next.js.
 *
 * En producción (Vercel serverless), cada función crea su propia instancia
 * pero Prisma maneja el connection pooling internamente.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
