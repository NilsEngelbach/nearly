// Nearly's service worker. The build fills in VERSION and FILES (vite.config.ts).
// Everything is precached on install and served from the cache; a new version
// installs in the background and waits until the page asks it to take over.
const VERSION = '__VERSION__';
const FILES = __FILES__;
const CACHE = `nearly-${VERSION}`;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(['/', ...FILES].map((f) => new Request(f, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('nearly-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname === '/version.txt') return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('/', { cacheName: CACHE }).then((r) => r || fetch(req)));
    return;
  }
  e.respondWith(
    caches.match(url.pathname, { cacheName: CACHE }).then(
      (r) =>
        r ||
        fetch(req).then((res) => {
          // Files outside the precache list (the latin-ext font) are kept once fetched.
          if (res.ok && url.pathname.startsWith('/assets/')) {
            const copy = res.clone();
            void caches.open(CACHE).then((c) => c.put(url.pathname, copy));
          }
          return res;
        }),
    ),
  );
});
