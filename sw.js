const CACHE_NAME = 'stock-dashboard-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 서비스 워커 설치 및 핵심 자원 사전 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 구버전 캐시 자동 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 요청 가로채기: Google Apps Script API 요청은 네트워크 직접 통신, 정적 자원은 캐시 우선
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 구글 스크립트 API는 캐시하지 않고 항상 실시간 네트워크 요청
  if (requestUrl.hostname.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {
        // 오프라인 시 fallback
        return caches.match('./index.html');
      });
    })
  );
});