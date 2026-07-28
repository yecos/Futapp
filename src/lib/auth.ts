import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'

/**
 * Configuración de NextAuth con Google OAuth + Prisma (Neon Postgres).
 *
 * Usa el adapter oficial @auth/prisma-adapter que maneja automáticamente
 * la creación de Users, Accounts, Sessions y VerificationTokens.
 *
 * El JWT callback consulta la DB directamente para mantener actualizado
 * el rol del usuario, su teamId y estado de membership.
 */

export const authOptions: NextAuthOptions = {
  // @ts-expect-error - El adapter de Prisma es compatible pero los tipos
  // difieren ligeramente entre versiones
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'placeholder-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder-client-secret',
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user }) {
      // Permitir el sign-in; la membership se resuelve en el jwt callback
      return true
    },

    async jwt({ token, user, trigger }) {
      // Primer login o refresh forzado: establecer userId
      if (user) {
        token.userId = user.id
      }

      // Refrescar si: primer login, update explícito, sin teamId, PENDIENTE, o TTL expirado (5 min)
      const TTL = 5 * 60 * 1000 // 5 minutos
      const needsRefresh = !token.lastRefresh || (Date.now() - token.lastRefresh) > TTL
      if (user || trigger === 'update' || (token.userId && !token.teamId) || token.membershipStatus === 'PENDIENTE' || needsRefresh) {
        token.lastRefresh = Date.now()
        try {
          // Buscar membership ACTIVO más reciente
          const membership = await db.teamMembership.findFirst({
            where: {
              userId: token.userId,
              status: 'ACTIVO',
            },
            orderBy: { joinedAt: 'desc' },
            include: { team: { select: { onboardingCompleted: true } } },
          })

          if (membership) {
            token.role = membership.role
            token.teamId = membership.teamId
            token.membershipStatus = membership.status
            token.onboardingCompleted = membership.team.onboardingCompleted
          } else {
            // Buscar membership PENDIENTE
            const pending = await db.teamMembership.findFirst({
              where: {
                userId: token.userId,
                status: 'PENDIENTE',
              },
              orderBy: { joinedAt: 'desc' },
            })

            if (pending) {
              token.role = 'SEGUIDOR'
              token.teamId = pending.teamId
              token.membershipStatus = 'PENDIENTE'
              token.onboardingCompleted = false
            } else {
              token.role = null
              token.teamId = null
              token.membershipStatus = null
              token.onboardingCompleted = false
            }
          }
        } catch (e: any) {
          console.error('[Auth:jwt] DB error:', e.message)
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.role = (token.role as string | null) || null
        session.user.teamId = (token.teamId as string | null) || null
        session.user.membershipStatus = (token.membershipStatus as string | null) || null
        session.user.onboardingCompleted = token.onboardingCompleted as boolean
      }
      return session
    },
  },
  events: {
    async signIn(message) {
      console.log('[Auth:event] Sign in success:', message.user.email)
    },
    async createUser(message) {
      console.log('[Auth:event] User created:', message.user.email)
    },
    async linkAccount(message) {
      console.log('[Auth:event] Account linked:', message.account.provider)
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string | null
      teamId?: string | null
      membershipStatus: string | null
      onboardingCompleted: boolean
    }
  }
  interface User {
    role?: string | null
    teamId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    role?: string | null
    teamId?: string | null
    membershipStatus?: string | null
    onboardingCompleted?: boolean
    lastRefresh?: number
  }
}
