'use client'

import { useEffect } from 'react'

/**
 * Registra el service worker para habilitar PWA (offline + push notifications).
 * Solo se ejecuta en producción para evitar interferir con HMR en dev.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registrado:', registration.scope)
          })
          .catch((err) => {
            console.error('[PWA] Error registrando SW:', err)
          })
      })
    }
  }, [])

  return null
}
