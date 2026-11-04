
const CACHE = 'edrees-portfolio-20261104-pwa6';
const APP_SHELL = [
    '/', '/index.html', '/projects.html', '/resume.html', '/contact.html',
    '/404.html', '/projects/ecommerce-platform.html',
    '/projects/ecommerce-migration.html', '/projects/oracle-erp-integration.html',
    '/projects/systems-integration.html', '/projects/engineering-lab.html',
    '/projects/home-network-selfhosting.html', '/projects/smart-home-automation.html',
    '/projects/baja-5b-maintenance.html', '/styles.css?v=20261104-v7',
    '/main.js?v=20261104-v5', '/pwa.js?v=20261104-app2',
    '/manifest.webmanifest', '/favicon.png',
    '/icons/icon-192.png', '/icons/icon-512.png',
    '/img/main_photo.jpg'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE)
        .then(cache => cache.addAll(APP_SHELL))
        .then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
    event.waitUntil(caches.keys()
        .then(keys => Promise.all(keys.filter(key => key.startsWith('edrees-portfolio-') && key !== CACHE)
            .map(key => caches.delete(key))))
        .then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin || /\.pdf$/i.test(url.pathname)) return;

    if (request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const response = await fetch(request);
                if (response.ok) {
                    const cache = await caches.open(CACHE);
                    cache.put(request, response.clone()).catch(() => {});
                }
                return response;
            } catch (_) {
                return (await caches.match(request, { ignoreSearch: true })) ||
                    (await caches.match('/index.html'));
            }
        })());
        return;
    }
    event.respondWith((async () => {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        try {
            const response = await fetch(request);
            if (response.ok) {
                const cache = await caches.open(CACHE);
                cache.put(request, response.clone()).catch(() => {});
            }
            return response;
        } catch (_) {
            return Response.error();
        }
    })());
});
