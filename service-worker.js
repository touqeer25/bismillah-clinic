// Bismillah Clinic - Service Worker (robust offline cache)
const CACHE_NAME = 'bhc-clinic-v21';

// Keep this list same-origin and reliable. Missing/external files are not allowed
// to break the whole install anymore.
const CORE_ASSETS = [
  './',
  './index.html',
  './service-worker.js',
  './diagnosis-data.js',
  './diagnosis-custom.js',
  './custom-data-help.js',
  './advanced-diagnosis-knowledge.js',
  './advanced-diagnosis-engine.js',
  './manifest.json',
  './repertory-data.json',
  './kent_repertory.json',
  './kent_de_repertory_by_key.json',
  './synthesis91_raw_repertory_by_key.json',
  './repertory_chapters/_index.json',
  './kent_chapters/_index.json',
  './kent_de_chapters/_index.json',
  './synthesis91_raw_chapters/_index.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192.png.png',
  './icon-512.png.png'
];

function isGet(req) { return req && req.method === 'GET'; }
function isSameOrigin(url) { return url.origin === self.location.origin; }

async function cacheCore() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(CORE_ASSETS.map(async function(url) {
    try {
      const req = new Request(url, { cache: 'reload' });
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) {
        await cache.put(req, res.clone());
      }
    } catch (err) {
      // Do not fail installation for optional/missing files.
      console.log('SW optional cache skipped:', url, err && err.message ? err.message : err);
    }
  }));
}

self.addEventListener('install', function(event) {
  event.waitUntil(cacheCore());
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) {
        if (name !== CACHE_NAME) return caches.delete(name);
      }));
    }).then(function() { return self.clients.claim(); })
  );
});

async function cachedIndex() {
  return (await caches.match('./index.html', { ignoreSearch: true })) ||
         (await caches.match('./', { ignoreSearch: true }));
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      cache.put(request, response.clone()).catch(function(){});
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === 'navigate' || request.destination === 'document') {
      const index = await cachedIndex();
      if (index) return index;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  return networkFirst(request);
}

self.addEventListener('fetch', function(event) {
  const request = event.request;
  if (!isGet(request)) return;
  const url = new URL(request.url);

  // Supabase API calls: never cache data mutations/reads; return JSON offline fallback.
  if (request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(request).catch(function() {
        return new Response(JSON.stringify({ error: 'offline', message: 'You are offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Navigation: network first, cached app shell offline.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request).catch(cachedIndex));
    return;
  }

  // Same-origin app/data files: network first so deployments update; cache fallback offline.
  if (isSameOrigin(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // CDN/fonts: cache first if previously fetched; otherwise network.
  event.respondWith(cacheFirst(request));
});
