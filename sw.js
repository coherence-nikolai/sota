// ─── Service Worker ───────────────────────────────────────────────────────────
// Offline-first for all core functions.
// AI Companion requires connectivity (API calls).

const CACHE_VERSION = 'sota-v10-context-r2';
const SHARED = [
  '/assets/tool-context.css?v=20260907-r2',
  '/assets/tool-context.js?v=20260907-r2',
];
const STATIC_ASSETS = [
  '/sota/',
  '/sota/index.html',
  '/sota/css/style.css',
  '/sota/js/providers.js',
  '/sota/js/vault.js',
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
  '/sota/assets/icons/sota-mark-transparent.png',
  ...SHARED,
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith('sota-v') && k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Only this app's public static resources. Never providers, API calls, or sibling apps.
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith('/sota/') && !SHARED.includes(url.pathname + url.search)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const navigation = event.request.mode === 'navigate';
    if (!navigation) {
      const cached = await cache.match(event.request);
      if (cached) return cached;
    }
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(cache.put(event.request, copy).catch(() => {}));
      }
      return response;
    } catch {
      return await cache.match(event.request)
        || (navigation ? await cache.match('/sota/index.html') : undefined)
        || Response.error();
    }
  })());
});
