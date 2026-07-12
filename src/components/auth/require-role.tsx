'use client'

import { useSession } from 'next-auth/react'
import type { Role } from '@prisma/client'
import { canEditTeam, canManagePayments, canEditEvents, canEditCallups } from '@/lib/permissions'

interface RequireRoleProps {
  roles?: Role[]
  permission?: 'editTeam' | 'managePayments' | 'editEvents' | 'editCallups'
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Componente para ocultar/mostrar elementos de UI según rol.
 * IMPORTANTE: La verificación de seguridad SIEMPRE debe estar en el server.
 * Este componente es solo para UX, no para seguridad.
 */
export function RequireRole({
  roles,
  permission,
  fallback = null,
  children,
}: RequireRoleProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') return null
  if (!session?.user) return <>{fallback}</>

  const userRole = session.user.role as Role

  let hasAccess = false
  if (roles) {
    hasAccess = roles.includes(userRole)
  } else if (permission === 'editTeam') {
    hasAccess = canEditTeam(userRole)
  } else if (permission === 'managePayments') {
    hasAccess = canManagePayments(userRole)
  } else if (permission === 'editEvents') {
    hasAccess = canEditEvents(userRole)
  } else if (permission === 'editCallups') {
    hasAccess = canEditCallups(userRole)
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}
