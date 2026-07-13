import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { SupabaseRestAdapter } from '@/lib/supabase-auth-adapter'
import { randomUUID } from 'crypto'

/**
 * Configuración de NextAuth con Google + Supabase REST API.
 * Con logging detallado para debugging.
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
    async signIn({ user, account, profile }) {
      console.log('[Auth:signIn] User:', user.email, 'Account provider:', account?.provider)
      return true
    },

    async jwt({ token, user, trigger }) {
      console.log('[Auth:jwt] Start. user:', !!user, 'trigger:', trigger, 'userId:', token.userId)

      if (user) {
        token.userId = user.id
        console.log('[Auth:jwt] Set userId:', user.id)

        // Verificar invite link
        const callbackUrl = token.callbackUrl as string | undefined
        const inviteMatch = callbackUrl?.match(/\/invite\/([a-f0-9-]+)/)
        if (inviteMatch) {
          console.log('[Auth:jwt] Invite link detected:', inviteMatch[1])
          try {
            const { supabase } = await import('@/lib/supabase-server')
            const { data: invite } = await supabase
              .from('InviteToken')
              .select('*')
              .eq('token', inviteMatch[1])
              .is('usedBy', null)
              .gt('expiresAt', new Date().toISOString())
              .single()

            if (invite) {
              console.log('[Auth:jwt] Invite found, creating membership')
              const { data: existing } = await supabase
                .from('TeamMembership')
                .select('id')
                .eq('userId', user.id)
                .eq('teamId', invite.teamId)
                .single()

              if (existing) {
                await supabase.from('TeamMembership').update({
                  role: invite.role, status: 'ACTIVO',
                  joinedAt: new Date().toISOString(),
                }).eq('id', existing.id)
              } else {
                await supabase.from('TeamMembership').insert({
                  id: randomUUID(), userId: user.id, teamId: invite.teamId,
                  role: invite.role, status: 'ACTIVO',
                  joinedAt: new Date().toISOString(),
                })
              }

              await supabase.from('InviteToken').update({
                usedBy: user.id, usedAt: new Date().toISOString(),
              }).eq('id', invite.id)

              const { data: team } = await supabase
                .from('Team').select('onboardingCompleted').eq('id', invite.teamId).single()

              token.role = invite.role
              token.teamId = invite.teamId
              token.membershipStatus = 'ACTIVO'
              token.onboardingCompleted = team?.onboardingCompleted ?? false
              console.log('[Auth:jwt] Invite processed, returning token')
              return token
            }
          } catch (e: any) {
            console.error('[Auth:jwt] Invite error:', e.message)
          }
        }
      }

      // Verificar membership en DB
      if (user || trigger === 'update' || (token.userId && !token.teamId) || token.membershipStatus === 'PENDIENTE') {
        console.log('[Auth:jwt] Checking membership for user:', token.userId)
        try {
          const { supabase } = await import('@/lib/supabase-server')

          const { data: memberships, error: memError } = await supabase
            .from('TeamMembership')
            .select('role, status, teamId, team:Team(onboardingCompleted)')
            .eq('userId', token.userId)
            .eq('status', 'ACTIVO')
            .order('joinedAt', { ascending: false })
            .limit(1)

          if (memError) {
            console.error('[Auth:jwt] Membership query error:', memError.message)
          }

          const membership = memberships?.[0]
          console.log('[Auth:jwt] Membership found:', !!membership)

          if (membership) {
            token.role = membership.role
            token.teamId = membership.teamId
            token.membershipStatus = membership.status
            token.onboardingCompleted = (membership.team as any)?.onboardingCompleted ?? false
            console.log('[Auth:jwt] Token updated: role=', token.role, 'teamId=', token.teamId)
          } else {
            const { data: pending } = await supabase
              .from('TeamMembership')
              .select('teamId')
              .eq('userId', token.userId)
              .eq('status', 'PENDIENTE')
              .limit(1)

            if (pending && pending.length > 0) {
              token.role = 'SEGUIDOR'
              token.teamId = pending[0].teamId
              token.membershipStatus = 'PENDIENTE'
              token.onboardingCompleted = false
              console.log('[Auth:jwt] Pending membership found')
            } else {
              token.role = null
              token.teamId = null
              token.membershipStatus = null
              token.onboardingCompleted = false
              console.log('[Auth:jwt] No membership found')
            }
          }
        } catch (e: any) {
          console.error('[Auth:jwt] DB error:', e.message)
        }
      }

      console.log('[Auth:jwt] Done. role:', token.role, 'teamId:', token.teamId)
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
  debug: true,
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
