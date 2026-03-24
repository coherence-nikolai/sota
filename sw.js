// ─── Service Worker ───────────────────────────────────────────────────────────
// Offline-first for all core functions.
// AI Companion requires connectivity (API calls).

const CACHE_VERSION = 'sota-v6';
const STATIC_ASSETS = [
  '/sota/',
  '/sota/index.html',
  '/sota/css/style.css',
  '/sota/js/storage.js',
  '/sota/js/agents.js',
  '/sota/js/api.js',
  '/sota/js/compass.js',
  '/sota/js/sit.js',
  '/sota/js/kasina.js',
  '/sota/js/tracker.js',
  '/sota/js/companion.js',
  '/sota/js/noting.js',
  '/sota/js/retreat.js',
  '/sota/js/voice.js',
  '/sota/js/app.js',
  '/sota/manifest.json',
  '/sota/assets/icons/icon-192.png',
  '/sota/assets/icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Let API calls go through — never cache them
  if (event.request.url.includes('api.anthropic.com')) return;
  if (event.request.url.includes('api.elevenlabs.io')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        return res;
      }).catch(() => caches.match('/sota/index.html'));
    })
  );
});
