// DQ 오프라인 지원: 앱 파일은 네트워크 우선, 실패하면 저장본 사용
const CACHE = 'dq-app-4.0.0';
const SHELL = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './favicon-192x192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => (k.startsWith('dq-app-') || k.startsWith('dq-loop-')) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'api.github.com' || url.hostname === 'gist.githubusercontent.com') return;
  const sameScope = url.origin === location.origin && url.pathname.startsWith(new URL(self.registration.scope).pathname);
  if (!sameScope && url.hostname !== 'cdn.jsdelivr.net') return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
