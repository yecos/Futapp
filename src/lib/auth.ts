import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { SupabaseRestAdapter } from '@/lib/supabase-auth-adapter'
import { randomUUID } from 'crypto'

/**
 * Configuración de NextAuth con Google + Supabase REST API Adapter.
 *
 * Flujo multi-tenant:
 * 1. Usuario se loguea con Google
 * 2. Si ya tiene membership activo → va directo al dashboard
 * 3. Si no tiene membership → va a /choose-team
 *    - Crear equipo nuevo (se hace ADMIN)
 *    - Ingresar código de invitación (se une con el rol del invite)
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
      if (user) {
        token.userId = user.id

        // Verificar si viene de un invite link (URL directa)
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

            await supabase
              .from('InviteToken')
              .update({
                usedBy: user.id,
                usedAt: new Date().toISOString(),
              })
              .eq('id', invite.id)

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

        // Cargar membership existente (sin crear nada automáticamente)
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
          // Usuario sin team membership → va a /choose-team
          token.role = null
          token.teamId = null
          token.membershipStatus = null
          token.onboardingCompleted = false
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
      console.log('[Auth] Sign in:', message.user.email)
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
  }
}
