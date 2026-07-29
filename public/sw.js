// Service Worker para Futapp PWA
// Cachea assets estáticos para offline-first

const CACHE_NAME = 'futapp-v1'
const STATIC_CACHE = 'futapp-static-v1'
const RUNTIME_CACHE = 'futapp-runtime-v1'

// Assets estáticos para cachear al instalar
const STATIC_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/logo.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Estrategia: cache-first para estáticos, network-first para API
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignorar fallos individuales
        return Promise.resolve()
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo manejar GET
  if (request.method !== 'GET') return

  // Ignorar requests de Next.js HMR (dev)
  if (url.pathname.startsWith('/_next/webpack-hmr')) return

  // Skip cross-origin
  if (url.origin !== self.location.origin) return

  // Network-first para API routes (siempre fresco)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request)
      })
    )
    return
  }

  // Cache-first para assets estáticos
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/logo.svg' ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          const responseClone = response.clone()
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
      })
    )
    return
  }

  // Stale-while-revalidate para páginas (HTML)
  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) => {
      return cache.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          // Solo cachear respuestas 200
          if (response.status === 200) {
            cache.put(request, response.clone())
          }
          return response
        }).catch(() => {
          // Si falla la red y tenemos cache, usarlo
          if (cached) return cached
          // Si no, devolver página offline
          return caches.match('/login')
        })
        return cached || fetchPromise
      })
    })
  )
})

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Futapp', body: 'Tienes una nueva notificación' }
  try {
    if (event.data) data = event.data.json()
  } catch (e) {
    // ignore
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Click en notificación → abrir URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      // Si no, abrir nueva
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
