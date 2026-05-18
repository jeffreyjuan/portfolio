const CACHE_NAME = 'wayz-v1';

self.addEventListener('install', (event) => {
  console.log('Wayz Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Wayz Service Worker activated');
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass through all network requests normally for now
  event.respondWith(fetch(event.request));
});