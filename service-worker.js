// Bismillah Clinic - Service Worker
const CACHE_NAME = 'bhc-clinic-v7';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './service-worker.js',
  './repertory-data.json',
  './kent_repertory.json',
  './kent_de_repertory_by_key.json',
  './kent_de_chapters/_index.json',
  './kent_chapters/_index.json',
  './synthesis91_raw_repertory_by_key.json',
  './synthesis91_raw_chapters/_index.json',
  './diagnosis-data.js',
  './diagnosis-custom.js',
  './custom-data-help.js',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap'
];

// Install
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('✅ Cache opened');
      return cache.addAll(urlsToCache).catch(function(err) {
        console.log('Cache add error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', function(event) {
  // Supabase API calls کو cache نہ کریں
  if (event.request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(JSON.stringify({ 
          error: 'offline',
          message: 'You are offline' 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
  // باقی سب کچھ cache سے
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      }
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200) {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(function() {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});