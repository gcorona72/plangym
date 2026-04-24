const CACHE_NAME = 'plan-comida-cache-v3';
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
  '/img/exercises/videos/real/bench-press.webm',
  '/img/exercises/videos/real/bent-over-row.webm',
  '/img/exercises/videos/real/deadlift.webm',
  '/img/exercises/videos/real/hanging-crunches.webm',
  '/img/exercises/videos/real/hip-thrust.webm',
  '/img/exercises/videos/real/incline-press.webm',
  '/img/exercises/videos/real/leg-raises.webm',
  '/img/exercises/videos/real/pull-up.webm',
  '/img/exercises/videos/real/push-up.webm',
  '/img/exercises/videos/real/shoulder-press.webm',
  '/img/exercises/videos/real/squat-bodyweight.webm',
  '/img/exercises/videos/real/squat.webm',
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

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin) {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (!response.ok) {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => caches.match('/index.html'));
    }),
  );
});

