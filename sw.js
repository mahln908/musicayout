const CACHE_NAME = 'house-mp3-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  'https://www.youtube.com/iframe_api'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('notificationclick', event => {
  const action = event.action;
  event.notification.close();
  
  const promiseChain = clients.matchAll()
    .then(clients => {
      clients.forEach(client => client.postMessage({ action }));
    });
  
  event.waitUntil(promiseChain);
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
