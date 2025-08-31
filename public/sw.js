// This is a basic service worker
self.addEventListener('install', event => {
  console.log('Service worker installing...');
  // Add a call to skipWaiting here
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service worker activating...');
});

self.addEventListener('fetch', event => {
  // A basic fetch handler. In a real app, you would add caching strategies.
  event.respondWith(fetch(event.request));
});
