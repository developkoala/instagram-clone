// 먹스타그램 Service Worker
const CACHE_NAME = 'mukstagram-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/mukstagram-logo.png',
  '/offline.html'
];

// 동적 콘텐츠 캐시
const DYNAMIC_CACHE = 'mukstagram-dynamic-v1';
const MAX_DYNAMIC_CACHE_SIZE = 50;

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch 이벤트 - 네트워크 우선 전략
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // API 요청은 항상 네트워크로
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // API 오프라인 응답
          return new Response(
            JSON.stringify({ 
              error: '오프라인 상태입니다. 인터넷 연결을 확인해주세요.' 
            }),
            { 
              headers: { 'Content-Type': 'application/json' },
              status: 503
            }
          );
        })
    );
    return;
  }

  // 이미지 캐싱
  if (request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
            return networkResponse;
          });
        });
      }).catch(() => {
        // 기본 이미지 반환
        return caches.match('/mukstagram-logo.png');
      })
    );
    return;
  }

  // 일반 요청 - 네트워크 우선, 캐시 폴백
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 성공적인 응답은 캐시에 저장
        const responseToCache = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // 네트워크 실패시 캐시에서 찾기
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }
          // 페이지 요청이면 오프라인 페이지 표시
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// 캐시 크기 제한
function limitCacheSize(cacheName, size) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(() => limitCacheSize(cacheName, size));
      }
    });
  });
}

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync', event);
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  }
});

async function syncPosts() {
  // 오프라인에서 작성된 포스트 동기화
  console.log('[ServiceWorker] Syncing posts...');
}

// 푸시 알림
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  
  let title = '먹스타그램 알림';
  let options = {
    body: '새로운 알림이 있습니다!',
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '확인하기',
        icon: '/favicon-32x32.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/favicon-32x32.png'
      }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    title = data.title || title;
    options.body = data.body || options.body;
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click received');
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/notifications')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});