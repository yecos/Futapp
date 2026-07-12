import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { SupabaseRestAdapter } from '@/lib/supabase-auth-adapter'
import { randomUUID } from 'crypto'

/**
 * Configuración de NextAuth con Google + Supabase REST API Adapter.
 *
 * IMPORTANTE: Usamos un adapter custom que usa REST API en lugar de
 * PostgreSQL directo porque Vercel no puede conectarse al pooler de
 * Supabase desde serverless functions en proyectos nuevos.
 *
 * Decisiones de diseño:
 * - JWT strategy (no DB sessions) → permite middleware en Edge runtime
 * - El rol del usuario se guarda en TeamMembership
 * - El primer usuario que se registra se convierte en ADMIN del primer Team
 */
export const authOptions: NextAuthOptions = {
  adapter: SupabaseRestAdapter(),
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
    async jwt({ token, user }) {
      // Solo en el primer login (user viene del adapter)
      if (user) {
        token.userId = user.id

        // Verificar si viene de un invite link
        const callbackUrl = token.callbackUrl as string | undefined
        const inviteMatch = callbackUrl?.match(/\/invite\/([a-f0-9-]+)/)
        if (inviteMatch) {
          const inviteToken = inviteMatch[1]
          const { supabase } = await import('@/lib/supabase-server')

          const { data: invite } = await supabase
            .from('InviteToken')
            .select('*')
            .eq('token', inviteToken)
            .is('usedBy', null)
            .gt('expiresAt', new Date().toISOString())
            .single()

          if (invite) {
            // Crear membership ACTIVO con el rol del invite
            const { data: existing } = await supabase
              .from('TeamMembership')
              .select('id')
              .eq('userId', user.id)
              .eq('teamId', invite.teamId)
              .single()

            if (existing) {
              await supabase
                .from('TeamMembership')
                .update({
                  role: invite.role,
                  status: 'ACTIVO',
                  joinedAt: new Date().toISOString(),
                })
                .eq('id', existing.id)
            } else {
              await supabase
                .from('TeamMembership')
                .insert({
                  id: randomUUID(),
                  userId: user.id,
                  teamId: invite.teamId,
                  role: invite.role,
                  status: 'ACTIVO',
                  joinedAt: new Date().toISOString(),
                })
            }

            // Marcar invite como usado
            await supabase
              .from('InviteToken')
              .update({
                usedBy: user.id,
                usedAt: new Date().toISOString(),
              })
              .eq('id', invite.id)

            // Obtener team
            const { data: team } = await supabase
              .from('Team')
              .select('onboardingCompleted')
              .eq('id', invite.teamId)
              .single()

            token.role = invite.role
            token.teamId = invite.teamId
            token.membershipStatus = 'ACTIVO'
            token.onboardingCompleted = team?.onboardingCompleted ?? false
            return token
          }
        }

        // Cargar o crear membership
        const { supabase } = await import('@/lib/supabase-server')

        const { data: membership } = await supabase
          .from('TeamMembership')
          .select('*, team!inner(*)')
          .eq('userId', user.id)
          .eq('status', 'ACTIVO')
          .single()

        if (membership) {
          token.role = membership.role
          token.teamId = membership.teamId
          token.membershipStatus = membership.status
          token.onboardingCompleted = (membership.team as any).onboardingCompleted
        } else {
          // Verificar si es el primer usuario → admin automático
          const { count } = await supabase
            .from('User')
            .select('*', { count: 'exact', head: true })

          if (count === 1) {
            // Primer usuario: crear Team por defecto y membership ADMIN
            const ts = new Date().toISOString()
            const teamId = randomUUID()
            const { data: team } = await supabase
              .from('Team')
              .insert({
                id: teamId,
                name: 'Mi Equipo',
                shortName: 'MEQ',
                category: 'Por configurar',
                coachName: user.name || 'Entrenador',
                foundedYear: new Date().getFullYear(),
                onboardingCompleted: false,
                isActive: true,
                createdAt: ts,
                updatedAt: ts,
              })
              .select()
              .single()

            await supabase
              .from('TeamMembership')
              .insert({
                id: randomUUID(),
                userId: user.id,
                teamId: teamId,
                role: 'ADMIN',
                status: 'ACTIVO',
                joinedAt: ts,
              })

            token.role = 'ADMIN'
            token.teamId = team.id
            token.membershipStatus = 'ACTIVO'
            token.onboardingCompleted = false
          } else {
            // Usuario sin invitación: crear membership PENDIENTE
            const { data: firstTeam } = await supabase
              .from('Team')
              .select('id, onboardingCompleted')
              .eq('isActive', true)
              .order('createdAt', { ascending: true })
              .limit(1)
              .single()

            if (firstTeam) {
              // Verificar si ya existe membership
              const { data: existing } = await supabase
                .from('TeamMembership')
                .select('id, status, role')
                .eq('userId', user.id)
                .eq('teamId', firstTeam.id)
                .single()

              if (!existing) {
                await supabase
                  .from('TeamMembership')
                  .insert({
                    id: randomUUID(),
                    userId: user.id,
                    teamId: firstTeam.id,
                    role: 'SEGUIDOR',
                    status: 'PENDIENTE',
                  })
              }

              token.role = existing?.role || 'SEGUIDOR'
              token.teamId = firstTeam.id
              token.membershipStatus = existing?.status || 'PENDIENTE'
              token.onboardingCompleted = firstTeam.onboardingCompleted
            }
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
