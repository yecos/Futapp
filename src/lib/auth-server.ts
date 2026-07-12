import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from './auth'
import type { Role } from '@prisma/client'

export interface SessionUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
  role: Role
  teamId: string
  membershipStatus: 'ACTIVO' | 'PENDIENTE' | 'RETIRADO' | 'BLOQUEADO'
  onboardingCompleted: boolean
}

/**
 * Obtiene la sesión del servidor. Retorna null si no hay sesión.
 */
export async function getSession(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return session.user as unknown as SessionUser
}

/**
 * Obtiene la sesión o redirige a /login si no existe.
 */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSession()
  if (!user) {
    redirect('/login')
  }
  return user
}

/**
 * Requiere que el usuario tenga uno de los roles especificados.
 * Si no, redirige a / (dashboard).
 */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireSession()

  // Si está pendiente, redirigir a página de espera
  if (user.membershipStatus === 'PENDIENTE') {
    redirect('/pending')
  }

  if (!roles.includes(user.role)) {
    redirect('/')
  }

  return user
}

/**
 * Requiere que el usuario sea admin.
 */
export async function requireAdmin(): Promise<SessionUser> {
  return requireRole('ADMIN')
}

/**
 * Verifica si el usuario puede acceder a un recurso.
 * Útil para checks en Server Actions sin redirigir.
 */
export async function canAccess(allowedRoles: Role[]): Promise<boolean> {
  const user = await getSession()
  if (!user) return false
  if (user.membershipStatus !== 'ACTIVO') return false
  return allowedRoles.includes(user.role)
}
