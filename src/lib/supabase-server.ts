import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase para uso en el servidor (Server Components, API routes, Server Actions).
 * Usa la service_role key que tiene acceso completo a la DB vía REST API.
 *
 * IMPORTANTE: Este cliente NUNCA debe exponerse al cliente (browser).
 * Para el cliente, usar src/lib/supabase-client.ts con la anon key.
 *
 * NOTA: La inicialización es lazy — solo se crea el cliente cuando se accede
 * a la propiedad `supabase` o se llama a `getSupabaseServer()`. Esto evita
 * que el build de Next.js falle cuando las variables de entorno no están
 * disponibles (ej. durante el `next build` en CI/local sin env vars).
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
 * Proxy lazy: el cliente se crea solo cuando se accede a una propiedad.
 * Esto permite que `import { supabase } from '@/lib/supabase-server'`
 * funcione durante el build sin requerir variables de entorno.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseServer()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
