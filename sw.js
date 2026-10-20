// Offline support. Bump VERSION whenever the app files change so phones pick up the update:
// the new worker installs, takes over, and the open app reloads into the new version.
const VERSION = 'teacher-v1';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './js/icons.js',
  './data/course.js',
  './js/store.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './fonts/inter-latin.woff2',
  './fonts/inter-latin-ext.woff2',
  './fonts/inter-cyrillic.woff2',
  './fonts/inter-cyrillic-ext.woff2',
];

// '?v=' makes GitHub's servers hand over this version's files, never an old copy they kept
// (the fetch handler matches with ignoreSearch, so the address works without it).
const fresh = (u) => new Request(u + (u.includes('?') ? '&' : '?') + 'v=' + VERSION, { cache: 'reload' });
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map(fresh))).then(() => self.skipWaiting()));
});

// Budget ("budget-…") and Notes ("notes-…") live on the same site with their own caches: only clear ours.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('teacher-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// The app opens straight from the phone's copy; new versions arrive through a new service worker.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const key = req.mode === 'navigate' ? './index.html' : req;
      const hit = await cache.match(key, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(key, res.clone());
        return res;
      } catch (err) {
        return (req.mode === 'navigate' && (await cache.match('./index.html', { ignoreSearch: true }))) || Response.error();
      }
    })
  );
});
