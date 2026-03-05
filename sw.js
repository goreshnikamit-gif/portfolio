const CACHE = 'portfolio-v3';
const SHELL = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Skip non-http (chrome-extension, etc.)
  if (!url.startsWith('http')) return;
  // Network-first for APIs
  if (url.includes('binance') || url.includes('allorigins') ||
      url.includes('corsproxy') || url.includes('yahoo') ||
      url.includes('exchangerate') || url.includes('coingecko') ||
      url.includes('fonts.g')) {
    e.respondWith(fetch(e.request).catch(() => new Response('',{status:503})));
    return;
  }
  // Cache-first for shell
  e.respondWith(
    caches.match(e.request).then(c => c || fetch(e.request).then(r => {
      if (r.ok) caches.open(CACHE).then(cache => cache.put(e.request, r.clone()));
      return r;
    }).catch(() => new Response('',{status:503})))
  );
});
