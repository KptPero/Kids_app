const CACHE_NAME = 'kids-edu-v3'

// Install: skip waiting to activate immediately
self.addEventListener('install', (e) => {
  self.skipWaiting()
})

// Activate: clean old caches and claim all clients
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Fetch: network-first with cache fallback (caches successful responses)
self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return

  // Skip cross-origin requests
  if (!e.request.url.startsWith(self.location.origin)) return

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache a copy of successful responses
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone))
        }
        return response
      })
      .catch(() => {
        // Offline: serve from cache, fallback to cached index.html for navigation
        return caches.match(e.request).then(cached => {
          if (cached) return cached
          if (e.request.mode === 'navigate') {
            return caches.match('index.html') || caches.match('/')
          }
          return new Response('Offline', { status: 503 })
        })
      })
  )
})
