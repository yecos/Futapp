import type { Role } from '@prisma/client'

/**
 * Sistema de permisos basado en roles (RBAC).
 * Estos helpers son PURAMENTE de UI (ocultar/mostrar elementos).
 * La verificación de seguridad SIEMPRE debe estar en el servidor
 * (auth-server.ts, requireRole, etc.).
 */

// ----- Permisos de edición -----

export function canEditTeam(role: Role): boolean {
  return role === 'ADMIN'
}

export function canEditBankInfo(role: Role): boolean {
  return role === 'ADMIN'
}

export function canManageMembers(role: Role): boolean {
  return role === 'ADMIN'
}

export function canEditEvents(role: Role): boolean {
  return ['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(role)
}

export function canEditCallups(role: Role): boolean {
  return ['ADMIN', 'ENTRENADOR'].includes(role)
}

export function canEditResults(role: Role): boolean {
  return ['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(role)
}

export function canPostAnnouncements(role: Role): boolean {
  return ['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(role)
}

export function canPinAnnouncements(role: Role): boolean {
  return ['ADMIN', 'ENTRENADOR'].includes(role)
}

// ----- Permisos de pagos -----

export function canManagePayments(role: Role): boolean {
  return role === 'ADMIN'
}

export function canSeePaymentDashboard(role: Role): boolean {
  return role === 'ADMIN'
}

export function canSeeOtherPayments(role: Role): boolean {
  return role === 'ADMIN'
}

export function canSeeOwnPayments(role: Role): boolean {
  return role !== 'SEGUIDOR'
}

export function canUploadReceipt(role: Role): boolean {
  return ['ADMIN', 'ENTRENADOR', 'JUGADOR', 'ACUDIENTE'].includes(role)
}

export function canSeeBankQR(role: Role): boolean {
  return ['ADMIN', 'ENTRENADOR', 'JUGADOR', 'ACUDIENTE'].includes(role)
}

// ----- Permisos de plantilla -----

export function canSeeRosterPhoneNumbers(role: Role): boolean {
  return ['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(role)
}

export function canSeePlayerMedicalInfo(role: Role): boolean {
  return ['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(role)
}

export function canEditPlayerStatus(role: Role): boolean {
  return ['ADMIN', 'ENTRENADOR', 'CUERPO_TECNICO'].includes(role)
}

/**
 * Caso especial acudiente: puede ver solo info de su hijo.
 * Retorna true si el viewer puede ver la info del player target.
 */
export function canViewPlayerDetails(
  role: Role,
  targetPlayerId: string,
  guardianPlayerId?: string // si el viewer es acudiente, playerId de su hijo
): boolean {
  if (role === 'ACUDIENTE') {
    return targetPlayerId === guardianPlayerId
  }
  return true // todos los demás roles activos pueden ver jugadores
}

// ----- Permisos de configuración -----

export function canAccessAdmin(role: Role): boolean {
  return role === 'ADMIN'
}

export function canGenerateInviteLink(role: Role): boolean {
  return role === 'ADMIN'
}

// ----- Helpers para UI -----

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  ENTRENADOR: 'Entrenador',
  JUGADOR: 'Jugador',
  CUERPO_TECNICO: 'Cuerpo Técnico',
  ACUDIENTE: 'Acudiente',
  SEGUIDOR: 'Seguidor',
}

export const ROLE_ICONS: Record<Role, string> = {
  ADMIN: '👑',
  ENTRENADOR: '🧢',
  JUGADOR: '👤',
  CUERPO_TECNICO: '🩺',
  ACUDIENTE: '👨‍👦',
  SEGUIDOR: '👀',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: 'Configura el equipo y gestiona usuarios',
  ENTRENADOR: 'Crea entrenamientos, convocatorias y alineaciones',
  JUGADOR: 'Confirma asistencia y consulta su información',
  CUERPO_TECNICO: 'Registra rendimiento, lesiones y estadísticas',
  ACUDIENTE: 'Gestiona a su hijo (categorías infantiles)',
  SEGUIDOR: 'Solo ve resultados, calendario y noticias',
}

/**
 * Lista de roles que se pueden asignar al invitar usuarios.
 */
export const ASSIGNABLE_ROLES: Role[] = [
  'ENTRENADOR',
  'JUGADOR',
  'CUERPO_TECNICO',
  'ACUDIENTE',
  'SEGUIDOR',
]
