'use server'

import { signOut } from 'next-auth/react'

export async function signOutButtonAction() {
  // Esta función solo se ejecuta en el cliente vía next-auth
  // pero la marcamos como 'use server' porque se usa en un form action
  await signOut({ callbackUrl: '/login' })
}
