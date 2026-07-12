import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase para uso en el servidor (Server Components, API routes, Server Actions).
 * Usa la service_role key que tiene acceso completo a la DB vía REST API.
 *
 * IMPORTANTE: Este cliente NUNCA debe exponerse al cliente (browser).
 * Para el cliente, usar src/lib/supabase-client.ts con la anon key.
 */

let _client: SupabaseClient | null = null

export function getSupabaseServer(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Faltan variables de entorno de Supabase. ' +
      'Necesitas NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY).'
    )
  }

  _client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  })

  return _client
}

/**
 * Alias corto para usar en el código.
 */
export const supabase = getSupabaseServer()
