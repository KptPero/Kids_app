/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

const CACHE_NAME = 'kids-edu-v2'
const FILES: string[] = []
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE_NAME).then(cache => FILES.length > 0 ? cache.addAll(FILES) : Promise.resolve()))
  self.skipWaiting()
})
self.addEventListener('fetch', (e)=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)))
})

export {}
