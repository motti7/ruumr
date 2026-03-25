/**
 * Service Worker for Ruumr
 * Handles offline support and precaching of core assets
 */

const CACHE_NAME = 'ruumr-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Precaching core assets');
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[ServiceWorker] Precache failed (some URLs unavailable):', err);
        // Continue even if some URLs fail - non-critical
      });
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first strategy with fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external origins (API calls, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first strategy for HTML, CSS, JS
  if (
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style'
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response
          const clonedResponse = response.clone();

          // Cache successful responses
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }

          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log('[ServiceWorker] Serving from cache:', request.url);
              return cached;
            }

            // No cached response, return offline fallback
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }

            return new Response('Offline - Resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain',
              }),
            });
          });
        })
    );
    return;
  }

  // Cache-first strategy for images, fonts, etc.
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'audio'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          console.log('[ServiceWorker] Serving from cache:', request.url);
          return cached;
        }

        return fetch(request)
          .then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response.clone());
              });
            }
            return response;
          })
          .catch(() => {
            // Return placeholder for failed assets
            if (request.destination === 'image') {
              return new Response(
                `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
                   <rect fill="#f0f0f0" width="100" height="100"/>
                   <text x="50" y="50" text-anchor="middle" dy="0.3em" fill="#999" font-size="14">
                     Offline
                   </text>
                 </svg>`,
                {
                  headers: { 'Content-Type': 'image/svg+xml' },
                }
              );
            }
            return new Response('Offline - Asset unavailable', { status: 503 });
          });
      })
    );
    return;
  }

  // Default: network-first for everything else
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});
