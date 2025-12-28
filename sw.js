const CACHE_VERSION = 'v1';
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// =====================
// Install
// =====================
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker: Installed');

  self.skipWaiting();

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/', 
        '/index.html',
        '/manifest.json'
      ]);
    })
  );
});

// =====================
// Activate
// =====================
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activated');

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (![IMAGE_CACHE, STATIC_CACHE].includes(key)) {
            console.log('🧹 Removing old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// =====================
// Fetch
// =====================
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = req.url;

  // ❌ تجاهل الطلبات غير GET
  if (req.method !== 'GET') return;

  // =====================
  // 🖼️ Cache الصور (Supabase Storage)
  // =====================
  if (url.includes('/storage/v1/object/public/')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          if (cached) {
            return cached;
          }

          return fetch(req)
            .then((res) => {
              if (res.status === 200) {
                cache.put(req, res.clone());
              }
              return res;
            })
            .catch(() => cached);
        })
      )
    );
    return;
  }

  // =====================
  // 🌐 Cache صفحات الموقع (Network First)
  // =====================
  if (req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          return caches.open(STATIC_CACHE).then((cache) => {
            cache.put(req, res.clone());
            return res;
          });
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // =====================
  // ⚡ باقي الملفات (Cache First)
  // =====================
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((res) => {
          if (res.status === 200) {
            return caches.open(STATIC_CACHE).then((cache) => {
              cache.put(req, res.clone());
              return res;
            });
          }
          return res;
        })
      );
    })
  );
});
