import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * Middleware de autenticación multi-tenant.
 *
 * Flujo:
 * 1. No logueado → /login
 * 2. Logueado sin teamId → /choose-team
 * 3. Logueado con teamId pero onboarding incompleto (admin) → /onboarding
 * 4. Logueado con membership PENDIENTE → /pending
 * 5. Logueado con teamId activo → dashboard
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (!token) return NextResponse.next()

    // Usuario sin team membership → redirigir a /choose-team
    // (excepto si ya está en páginas permitidas)
    const isAuthed = !!token.userId
    const hasTeam = !!token.teamId
    const allowedPaths = ['/choose-team', '/login', '/pending', '/onboarding', '/invite']
    const isAllowedPath = allowedPaths.some(p => path.startsWith(p)) || path.startsWith('/api/')

    if (isAuthed && !hasTeam && !isAllowedPath) {
      return NextResponse.redirect(new URL('/choose-team', req.url))
    }

    // Usuario pendiente de aprobación
    if (token.membershipStatus === 'PENDIENTE' && path !== '/pending' && !isAllowedPath) {
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
    '/((?!api/auth|api/cron|api/debug|_next/static|_next/image|favicon.ico|login|invite|pending|onboarding|choose-team|public|logo.svg|manifest.json|robots.txt).*)',
  ],
}
