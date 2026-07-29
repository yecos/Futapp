import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * Middleware de autenticación multi-tenant.
 *
 * Flujo:
 * 1. No logueado → /login
 * 2. Logueado sin teamId → /choose-team
 * 3. Logueado con membership PENDIENTE → /pending
 *    PERO puede ir a /choose-team para crear/unirse a otro equipo
 * 4. Logueado con teamId pero onboarding incompleto (admin) → /onboarding
 * 5. Logueado con teamId activo → dashboard
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (!token) return NextResponse.next()

    const isAuthed = !!token.userId
    const hasTeam = !!token.teamId
    const isPending = token.membershipStatus === 'PENDIENTE'

    // Páginas que el usuario SIEMPRE puede visitar (con sesión)
    const publicPaths = ['/choose-team', '/login', '/pending', '/onboarding', '/invite', '/leave-team']
    const isPublicPath = publicPaths.some(p => path.startsWith(p)) || path.startsWith('/api/')

    // Usuario sin team → /choose-team
    if (isAuthed && !hasTeam && !isPublicPath) {
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
    // Excluir TODAS las API routes del middleware — las API manejan su propia
    // autenticación con getServerSession y devuelven JSON 401, no redirects.
    // Solo se aplica middleware a páginas (Server Components) que necesitan
    // redirect por flujo de usuario (choose-team, pending, onboarding, etc.)
    '/((?!api|_next/static|_next/image|favicon.ico|login|invite|pending|onboarding|choose-team|leave-team|auth-error|mi-perfil|public|logo.svg|manifest.json|robots.txt).*)',
  ],
}
