const CACHE_NAME = 'tunepocket-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/styles.css', // Assuming a css file, adjust if using component-level styling
  '/app.js',     // Your main JS bundle
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  'https://telegram.org/js/telegram-web-app.js',
  'https://cdn.jsdelivr.net/npm/music-metadata-browser@2.5.10/dist/music-metadata-browser.min.js',
  'https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=Belleza&display=swap',
  // Add other assets like fonts if hosted locally
];

self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // IMPORTANT: Clone the request. A request is a stream and
        // can only be consumed once. Since we are consuming this
        // once by cache and once by the browser for fetch, we need
        // to clone the response.
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              if (response.type !== 'opaque') { // Opaque for CDN requests
                return response;
              }
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // We don't cache POST requests or telegram file links
                if (event.request.method === 'GET' && !event.request.url.includes('api.telegram.org')) {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
