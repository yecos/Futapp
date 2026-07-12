import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'

/**
 * Configuración de NextAuth con Google + Prisma Adapter.
 *
 * Decisiones de diseño:
 * - JWT strategy (no DB sessions) → permite middleware en Edge runtime
 * - El rol del usuario se guarda en TeamMembership, no en User
 * - En cada login, cargamos el membership activo y lo metemos al token
 * - El primer usuario que se registra se convierte en ADMIN del primer Team
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Solo en el primer login (user viene del adapter)
      if (user) {
        token.userId = user.id

        // Si viene de un invite link, canjear el token
        const callbackUrl = token.callbackUrl as string | undefined
        const inviteMatch = callbackUrl?.match(/\/invite\/([a-f0-9-]+)/)
        if (inviteMatch) {
          const inviteToken = inviteMatch[1]
          const invite = await db.inviteToken.findUnique({
            where: { token: inviteToken },
          })
          if (invite && !invite.usedBy && invite.expiresAt > new Date()) {
            // Crear membership ACTIVO con el rol del invite
            await db.teamMembership.upsert({
              where: { userId_teamId: { userId: user.id, teamId: invite.teamId } },
              update: { role: invite.role, status: 'ACTIVO', joinedAt: new Date() },
              create: {
                userId: user.id,
                teamId: invite.teamId,
                role: invite.role,
                status: 'ACTIVO',
                joinedAt: new Date(),
              },
            })
            // Marcar invite como usado
            await db.inviteToken.update({
              where: { id: invite.id },
              data: { usedBy: user.id, usedAt: new Date() },
            })
            const team = await db.team.findUnique({ where: { id: invite.teamId } })
            token.role = invite.role
            token.teamId = invite.teamId
            token.membershipStatus = 'ACTIVO'
            token.onboardingCompleted = team?.onboardingCompleted ?? false
            return token
          }
        }

        // Cargar o crear membership
        const membership = await db.teamMembership.findFirst({
          where: { userId: user.id, status: 'ACTIVO' },
          include: { team: true },
        })

        if (membership) {
          token.role = membership.role
          token.teamId = membership.teamId
          token.membershipStatus = membership.status
          token.onboardingCompleted = membership.team.onboardingCompleted
        } else {
          // Verificar si es el primer usuario → admin automático
          const userCount = await db.user.count()
          if (userCount === 1) {
            // Primer usuario: crear Team por defecto y membership ADMIN
            const team = await db.team.create({
              data: {
                name: 'Mi Equipo',
                shortName: 'MEQ',
                category: 'Por configurar',
                coachName: user.name || 'Entrenador',
                foundedYear: new Date().getFullYear(),
                onboardingCompleted: false,
              },
            })
            await db.teamMembership.create({
              data: {
                userId: user.id,
                teamId: team.id,
                role: 'ADMIN',
                status: 'ACTIVO',
                joinedAt: new Date(),
              },
            })
            token.role = 'ADMIN'
            token.teamId = team.id
            token.membershipStatus = 'ACTIVO'
            token.onboardingCompleted = false
          } else {
            // Usuario sin invitación: crear membership PENDIENTE
            const firstTeam = await db.team.findFirst({
              where: { isActive: true },
            })
            if (firstTeam) {
              await db.teamMembership.upsert({
                where: { userId_teamId: { userId: user.id, teamId: firstTeam.id } },
                update: {},
                create: {
                  userId: user.id,
                  teamId: firstTeam.id,
                  role: 'SEGUIDOR',
                  status: 'PENDIENTE',
                },
              })
            }
            token.role = 'SEGUIDOR'
            token.teamId = firstTeam?.id
            token.membershipStatus = 'PENDIENTE'
            token.onboardingCompleted = firstTeam?.onboardingCompleted ?? false
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.teamId = token.teamId as string | undefined
        session.user.membershipStatus = token.membershipStatus as string
        session.user.onboardingCompleted = token.onboardingCompleted as boolean
      }
      return session
    },
  },
  events: {
    // Log de errores de sign-in para debugging
    async signIn(message) {
      console.log('[Auth] Sign in:', message.user.email)
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

// Extender tipos de NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
      teamId?: string
      membershipStatus: string
      onboardingCompleted: boolean
    }
  }
  interface User {
    role?: string
    teamId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    role?: string
    teamId?: string
    membershipStatus?: string
    onboardingCompleted?: boolean
  }
}
