const CACHE_NAME = 'itinerario-jambraoa-v1';

const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png',
    './icons/apple-touch-icon.png',
    './icons/favicon-32.png',
    './icons/favicon-16.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        ))
    );
    self.clients.claim();
});

// Estrategia stale-while-revalidate: responde desde cache al instante y actualiza en segundo plano.
// Cubre tambien el script de html2canvas (CDN) para que la exportacion a JPG funcione offline
// despues de la primera carga con internet.
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    event.respondWith(
        caches.match(req).then(cached => {
            const networkFetch = fetch(req).then(networkResp => {
                if (networkResp && (networkResp.status === 200 || networkResp.type === 'opaque')) {
                    const respClone = networkResp.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, respClone));
                }
                return networkResp;
            }).catch(() => cached);

            return cached || networkFetch;
        })
    );
});
