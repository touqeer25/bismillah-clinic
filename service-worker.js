// Bismillah Clinic - Service Worker (robust offline cache)
const CACHE_NAME='bhc-clinic-v139';

// Keep this list same-origin and reliable. Missing/external files are not allowed
// to break the whole install anymore.
const CORE_ASSETS = [
  './',
  './index.html',
  './css/app.css',
  './css/repertory.css',
  './css/differentiation.css',
  './css/repertory-tree.css',
  './css/library.css',
  './css/layout-header.css',
  './css/layout-repertory-toolbar.css',
  './css/layout-differentiation.css',
  './css/rep-case.css',
  './css/rubric-ur.css',
  './css/rubrics-ur.css',
  './css/differentiation-books.css',
  './css/repertory-pagetabs.css',
  './css/differentiation-table.css',
  './css/differentiation-compact.css',
  // v94: مواد الگ JSON فائلوں میں + اس کا لوڈر
  './js/00-data-boot.js',
  './data/diagnosis.json',
  './data/treatment.json',
  './data/dx-knowledge.json',
  './js/01-app-core.js',
  './js/02-app-auth.js',
  './js/03-app-patients.js',
  './js/04-app-visit-modal.js',
  './js/05-app-diagnosis.js',
  './js/06-app-new-visit.js',
  './js/07-app-settings.js',
  './js/repertory/rep-books.js',
  './js/repertory/rep-chapters.js',
  './js/repertory/KENT_ORDER_METHOD.md',   // v131: ترتیب کا طریقہ کار (کینٹ کے ساتھ منسلک دستاویز)
  './js/repertory/rep-folders.js',
  './js/repertory/rep-tree.js',
  './js/repertory/rep-clipboards.js',
  './js/repertory/rep-compare-mode.js',
  './js/repertory/rep-rubric-detail.js',
  './js/repertory/rep-search.js',
  './js/repertory/rep-workbench.js',
  './js/repertory/rep-analysis.js',
  './js/repertory/LOAD_ORDER.txt',
  './ur/rubric_labels_ur.json',
  // v98: تفریق / نکاسی اب آٹھ حصوں میں (js/differentiation/) — پرانی 08b حذف ہو چکی
  './js/differentiation/01-diff-core.js',
  './js/differentiation/02-diff-data.js',
  './js/differentiation/03-diff-engine.js',
  './js/differentiation/04-diff-rubric-mode.js',
  './js/differentiation/05-diff-books-witness.js',
  './js/differentiation/06-diff-shell.js',
  './js/differentiation/07-diff-views.js',
  './js/differentiation/08-diff-extract.js',
  './js/differentiation/LOAD_ORDER.txt',
  './js/08c-rep-materia-medica.js',
  './js/08d-library.js',
  './mm/_index.json',
  './mm/drafts_seed.json',
  './js/09-app-init.js',
  './js/11-app-studio.js',
  './js/pwa.js',
  './js/13-case-taking.js',
  './js/15-dx-views.js',
  './js/16-rep-case.js',
  './js/17-rubric-ur.js',
  './js/18-rubrics-ur.js',
  './ur/rubrics/kent/mind.json',
  './ur/rubrics/kent/vertigo.json',
  './ur/rubrics/kent/head.json',
  './ur/rubrics/kent/eye.json',
  './ur/rubrics/kent/vision.json',
  './ur/rubrics/kent/ear.json',
  './ur/rubrics/kent/hearing.json',
  './ur/rubrics/kent/nose.json',
  './ur/rubrics/kent/face.json',
  './ur/rubrics/kent/mouth.json',
  './ur/rubrics/kent/teeth.json',
  './ur/rubrics/kent/throat.json',
  './ur/rubrics/kent/external_throat.json',
  './ur/rubrics/kent/stomach.json',
  './ur/rubrics/kent/abdomen.json',
  './ur/rubrics/kent/stool.json',
  './ur/rubrics/kent/bladder.json',
  './ur/rubrics/kent/kidneys.json',
  './ur/rubrics/kent/prostate_gland.json',
  './ur/rubrics/kent/rectum.json',
  './ur/rubrics/kent/urethra.json',
  './ur/rubrics/kent/urine.json',
  './ur/rubrics/kent/genitalia_male.json',
  './ur/rubrics/kent/genitalia_female.json',
  './ur/rubrics/kent/larynx_and_trachea.json',
  './ur/rubrics/kent/respiration.json',
  './ur/rubrics/kent/expectoration.json',
  './ur/rubrics/kent/cough.json',
  './ur/rubrics/kent/chest.json',
  './ur/rubrics/kent/back.json',
  './ur/rubrics/kent/extremities.json',
  './ur/rubrics/kent/sleep.json',
  './ur/rubrics/kent/chill.json',
  './ur/rubrics/kent/fever.json',
  './ur/rubrics/kent/perspiration.json',
  './service-worker.js',
  './diagnosis-custom.js',
  './custom-data-help.js',
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
  './allen_fever_repertory.json',
  './hs_clinical_repertory.json',
  './keynotes_cc_repertory.json',
  './nosodes_repertory.json',
  './allen_fever_chapters/_index.json',
  './hs_clinical_chapters/_index.json',
  './keynotes_cc_chapters/_index.json',
  './nosodes_chapters/_index.json',
  './hering_mind_repertory.json',
  './hering_mind_chapters/_index.json',
  './boger_times_repertory.json',
  './boger_times_chapters/_index.json',
  './tissues_bd_repertory.json',
  './tissues_bd_chapters/_index.json',
  './kent_rubric_notes.json',
  './remedy_names.json',
  './ur/rubric_labels_ur.json',
  './icon-192.png',
  './icon-512.png'
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
