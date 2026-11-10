const CACHE = 'edrees-portfolio-20261110-contact2';
const ROUTES = ["","projects.html","resume.html","contact.html","projects/ecommerce-platform.html","projects/ecommerce-migration.html","projects/oracle-erp-integration.html","projects/systems-integration.html","projects/printguard-ai-monitoring.html","projects/engineering-lab.html","projects/home-network-selfhosting.html","projects/smart-home-automation.html","projects/baja-5b-maintenance.html"];
const APP_SHELL = [
  '/', '/index.html', '/ar/', '/ar/index.html',
  ...ROUTES.filter(Boolean).map(path => '/' + path),
  ...ROUTES.filter(Boolean).map(path => '/ar/' + path),
  '/404.html', '/ar/404.html',
  '/styles.css?v=20261110-contact2',
  '/main.js?v=20261110-contact2',
  '/pwa.js?v=20261109-ar1',
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
        return (await caches.match(request, {ignoreSearch: true}))
          || (await caches.match(url.pathname.startsWith('/ar/') ? '/ar/index.html' : '/index.html'));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request, {ignoreSearch: true});
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