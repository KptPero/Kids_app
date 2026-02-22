const CACHE_NAME = 'kids-edu-v1'
const FILES = ['/', '/index.html', '/src/main.tsx', '/src/styles.css', '/manifest.webmanifest', '/icons/icon-192.svg', '/icons/icon-512.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => {
      if (k !== CACHE_NAME) return caches.delete(k)
    })))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)))
})
