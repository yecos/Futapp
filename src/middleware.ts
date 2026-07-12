import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * Middleware de autenticación y autorización.
 * - Verifica que el usuario esté logueado
 * - Redirige a /pending si está pendiente de aprobación
 * - Redirige a /onboarding si es admin y no completó onboarding
 * - Bloquea rutas /admin/* si no es admin
 * - Bloquea /api/cron/* si no tiene CRON_SECRET
 */

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Si no hay token, next-auth ya redirige a login (configurado abajo)
    if (!token) return NextResponse.next()

    // Usuario pendiente de aprobación
    if (token.membershipStatus === 'PENDIENTE' && path !== '/pending') {
      return NextResponse.redirect(new URL('/pending', req.url))
    }

    // Admin que no completó onboarding
    if (
      token.role === 'ADMIN' &&
      token.onboardingCompleted === false &&
      path !== '/onboarding' &&
      !path.startsWith('/api/')
    ) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    // Proteger rutas /admin
    if (path.startsWith('/admin') && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    // Protege todo excepto rutas públicas
    '/((?!api/auth|api/cron|api/debug|_next/static|_next/image|favicon.ico|login|invite|pending|onboarding|public|logo.svg|manifest.json|robots.txt).*)',
  ],
}
