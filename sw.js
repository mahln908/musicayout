const CACHE_NAME = 'house-mp3-v4';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('youtube.com/iframe_api')) {
        return fetch(event.request);
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'playback-sync') {
        event.waitUntil(
            self.clients.matchAll()
                .then(clients => {
                    clients.forEach(client => {
                        client.postMessage({ action: 'backgroundPlay' });
                    });
                })
        );
    }
});

self.addEventListener('message', (event) => {
    if (event.data.action === 'updatePlayback') {
        self.registration.sync.register('playback-sync');
    }
});
