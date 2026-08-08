import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * Middleware de autenticación dual:
 * - Usuario de equipo: teamId en JWT, flujo choose-team → onboarding → dashboard
 * - Jugador libre: isFreePlayer en JWT, flujo registro-jugador-libre → mi-carta
 *
 * Ambos tipos de usuario pueden coexistir. Un usuario puede ser jugador libre
 * Y miembro de un equipo al mismo tiempo.
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (!token) return NextResponse.next()

    const isAuthed = !!token.userId
    const hasTeam = !!token.teamId
    const isFreePlayer = !!token.isFreePlayer
    const isPending = token.membershipStatus === 'PENDIENTE'

    // Páginas que el usuario SIEMPRE puede visitar (con sesión)
    const publicPaths = [
      '/choose-team', '/login', '/pending', '/onboarding', '/invite',
      '/leave-team', '/registro-jugador-libre', '/mi-carta', '/carta',
      '/test-fisico', '/jugadores-libres',
    ]
    const isPublicPath = publicPaths.some(p => path.startsWith(p)) || path.startsWith('/api/')

    // Usuario sin team y sin perfil de jugador libre → elegir camino
    if (isAuthed && !hasTeam && !isFreePlayer && !isPublicPath) {
      return NextResponse.redirect(new URL('/choose-team', req.url))
    }

    // Usuario pendiente → /pending (excepto si va a choose-team para salir)
    if (isAuthed && isPending && path !== '/pending' && path !== '/choose-team' && path !== '/leave-team' && !path.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/pending', req.url))
    }

    // Admin que no completó onboarding
    if (
      token.role === 'ADMIN' &&
      token.onboardingCompleted === false &&
      path !== '/onboarding' &&
      !path.startsWith('/api/') &&
      !isPublicPath
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
    '/((?!api|_next/static|_next/image|favicon.ico|login|invite|pending|onboarding|choose-team|leave-team|auth-error|mi-perfil|public|logo.svg|manifest.json|robots.txt|sw.js|icons|carta|registro-jugador-libre|mi-carta|test-fisico|jugadores-libres).*)',
  ],
}
