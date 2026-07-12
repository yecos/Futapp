import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (!token) return NextResponse.next()

    if (token.membershipStatus === 'PENDIENTE' && path !== '/pending') {
      return NextResponse.redirect(new URL('/pending', req.url))
    }

    if (
      token.role === 'ADMIN' &&
      token.onboardingCompleted === false &&
      path !== '/onboarding' &&
      !path.startsWith('/api/')
    ) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

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
    '/((?!api/auth|api/cron|api/debug|_next/static|_next/image|favicon.ico|login|invite|pending|onboarding|public|logo.svg|manifest.json|robots.txt).*)',
  ],
}
