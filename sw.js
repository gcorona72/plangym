const CACHE_NAME = 'plan-comida-cache-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/site.webmanifest',
  '/icon.png',
  '/icon.svg',
  '/favicon.ico',
  '/404.html',
  '/img/exercises/accessory.svg',
  '/img/exercises/calves.svg',
  '/img/exercises/hinge.svg',
  '/img/exercises/pull.svg',
  '/img/exercises/push.svg',
  '/img/exercises/squat.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => (key === CACHE_NAME ? Promise.resolve() : caches.delete(key))),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => caches.match('/index.html'));
    }),
  );
});

