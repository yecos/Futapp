import type { Adapter, AdapterAccount, AdapterSession, AdapterUser, VerificationToken } from 'next-auth/adapters'
import { supabase } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

/**
 * Adapter custom de NextAuth que usa Supabase REST API.
 *
 * IMPORTANTE: Generamos los IDs explícitamente con randomUUID() porque
 * las columnas 'id' en Supabase no tienen DEFAULT (se crearon con SQL
 * manual, no con Prisma migrate que habría aplicado @default(cuid())).
 *
 * También seteamos createdAt y updatedAt explícitamente por la misma razón.
 */

function now(): string {
  return new Date().toISOString()
}

function genId(): string {
  return randomUUID()
}

export function SupabaseRestAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, 'id'>) {
      const ts = now()
      const id = genId()
      console.log('[SupabaseAdapter] createUser:', { id, email: user.email })
      const { data, error } = await supabase
        .from('User')
        .insert({
          id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified?.toISOString(),
          createdAt: ts,
          updatedAt: ts,
        })
        .select()
        .single()

      if (error) {
        console.error('[SupabaseAdapter] createUser error:', error)
        throw error
      }
      console.log('[SupabaseAdapter] createUser success:', data.id)
      return mapUser(data)
    },

    async getUser(id: string) {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      return mapUser(data)
    },

    async getUserByEmail(email: string) {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      return mapUser(data)
    },

    async getUserByAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }) {
      const { data: account, error: accError } = await supabase
        .from('Account')
        .select('userId')
        .eq('provider', provider)
        .eq('providerAccountId', providerAccountId)
        .single()

      if (accError) {
        if (accError.code === 'PGRST116') return null
        throw accError
      }
      if (!account) return null

      const { data: user, error: userError } = await supabase
        .from('User')
        .select('*')
        .eq('id', account.userId)
        .single()

      if (userError) throw userError
      return mapUser(user)
    },

    async updateUser(user: Partial<AdapterUser> & { id: string }) {
      const update: any = { updatedAt: now() }
      if (user.email !== undefined) update.email = user.email
      if (user.name !== undefined) update.name = user.name
      if (user.image !== undefined) update.image = user.image
      if (user.emailVerified !== undefined) {
        update.emailVerified = user.emailVerified instanceof Date
          ? user.emailVerified.toISOString()
          : user.emailVerified
      }

      const { data, error } = await supabase
        .from('User')
        .update(update)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return mapUser(data)
    },

    async deleteUser(userId: string) {
      await supabase.from('User').delete().eq('id', userId)
    },

    async linkAccount(account: AdapterAccount) {
      const id = genId()
      console.log('[SupabaseAdapter] linkAccount:', { id, provider: account.provider, userId: account.userId })
      const { error } = await supabase
        .from('Account')
        .insert({
          id,
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        })

      if (error) {
        console.error('[SupabaseAdapter] linkAccount error:', error)
        throw error
      }
      console.log('[SupabaseAdapter] linkAccount success')
    },

    async unlinkAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }) {
      await supabase
        .from('Account')
        .delete()
        .eq('provider', provider)
        .eq('providerAccountId', providerAccountId)
    },

    async createSession(session: { sessionToken: string; userId: string; expires: Date }) {
      const id = genId()
      const { data, error } = await supabase
        .from('Session')
        .insert({
          id,
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires.toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return {
        sessionToken: data.sessionToken,
        userId: data.userId,
        expires: new Date(data.expires),
      }
    },

    async getSessionAndUser(sessionToken: string) {
      const { data: session, error: sessError } = await supabase
        .from('Session')
        .select('*')
        .eq('sessionToken', sessionToken)
        .single()

      if (sessError) {
        if (sessError.code === 'PGRST116') return null
        throw sessError
      }
      if (!session) return null

      const { data: user, error: userError } = await supabase
        .from('User')
        .select('*')
        .eq('id', session.userId)
        .single()

      if (userError) throw userError

      return {
        session: {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: new Date(session.expires),
        },
        user: mapUser(user),
      }
    },

    async updateSession(session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>) {
      const update: any = {}
      if (session.expires) {
        update.expires = session.expires instanceof Date
          ? session.expires.toISOString()
          : session.expires
      }
      if (session.userId) update.userId = session.userId

      const { data, error } = await supabase
        .from('Session')
        .update(update)
        .eq('sessionToken', session.sessionToken)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      return {
        sessionToken: data.sessionToken,
        userId: data.userId,
        expires: new Date(data.expires),
      }
    },

    async deleteSession(sessionToken: string) {
      await supabase.from('Session').delete().eq('sessionToken', sessionToken)
    },

    async createVerificationToken(verificationToken: VerificationToken) {
      const { data, error } = await supabase
        .from('VerificationToken')
        .insert({
          identifier: verificationToken.identifier,
          token: verificationToken.token,
          expires: verificationToken.expires.toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return {
        identifier: data.identifier,
        token: data.token,
        expires: new Date(data.expires),
      }
    },

    async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
      const { data, error } = await supabase
        .from('VerificationToken')
        .select('*')
        .eq('identifier', identifier)
        .eq('token', token)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      await supabase
        .from('VerificationToken')
        .delete()
        .eq('identifier', identifier)
        .eq('token', token)

      return {
        identifier: data.identifier,
        token: data.token,
        expires: new Date(data.expires),
      }
    },
  }
}

function mapUser(data: any): AdapterUser {
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    image: data.image,
    emailVerified: data.emailVerified ? new Date(data.emailVerified) : null,
  }
}
