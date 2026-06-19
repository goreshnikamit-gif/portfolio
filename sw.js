const CACHE = 'portfolio-v8-20260619-final';
const SHELL = ['./index.html', './manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

function isLiveDataRequest(url) {
  return [
    'binance', 'allorigins', 'corsproxy', 'yahoo', 'finnhub',
    'exchangerate', 'coingecko', 'thingproxy', 'fonts.g',
    'firebase', 'googleapis', 'gstatic'
  ].some(part => url.includes(part));
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = request.url;
  if (!url.startsWith('http') || request.method !== 'GET') return;

  if (isLiveDataRequest(url)) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put('./index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response.ok) {
          caches.open(CACHE).then(cache => cache.put(request, response.clone()));
        }
        return response;
      });
      return cached || network;
    }).catch(() => new Response('', { status: 503 }))
  );
});
