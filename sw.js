// Service Worker para House MP3 Player
const CACHE_NAME = 'house-mp3-v2';
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
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('notificationclick', event => {
  const action = event.action;
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll()
      .then(clients => {
        clients.forEach(client => {
          if (action === 'previous') {
            client.postMessage({ action: 'previous' });
          } else if (action === 'next') {
            client.postMessage({ action: 'next' });
          } else if (action === 'play') {
            client.postMessage({ action: 'play' });
          } else if (action === 'pause') {
            client.postMessage({ action: 'pause' });
          }
        });
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  event.waitUntil(self.clients.claim());
});
