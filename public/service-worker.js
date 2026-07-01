/**
 * ImgX Service Worker
 * 提供离线缓存、资源预加载和后台同步能力
 *
 * 缓存策略：
 * - 静态资源：Cache First（CSS/JS/字体/图标）
 * - 导航请求：Network First，离线时回退到离线页面
 * - API 请求：Network Only（不缓存，保证数据新鲜）
 * - 图片：Cache First（CDN 图片缓存）
 */

const CACHE_VERSION = 'imgx-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const OFFLINE_PAGE = '/offline.html';

// 预缓存的核心静态资源
const PRECACHE_URLS = [
  OFFLINE_PAGE,
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// 缓存大小限制
const IMAGE_CACHE_MAX_ITEMS = 200;
const IMAGE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 天

// ==================== Install ====================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// ==================== Activate ====================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('imgx-') && name !== STATIC_CACHE && name !== IMAGE_CACHE)
          .map((name) => caches.delete(name))
          .concat([
            // 清理旧版本图片缓存中的过期项
            cleanupImageCache(),
          ])
      );
    }).then(() => self.clients.claim())
  );
});

// ==================== Fetch ====================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') return;

  // 跳过 WebSocket 和 Chrome 扩展
  if (url.protocol === 'ws:' || url.protocol === 'wss:' || url.protocol === 'chrome-extension:') return;

  // 1. 导航请求（页面访问）
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, OFFLINE_PAGE));
    return;
  }

  // 2. API 请求（GitHub API、Next.js API）
  if (url.pathname.startsWith('/api/') || url.hostname === 'api.github.com') {
    // API 不缓存，但网络失败时返回友好提示
    event.respondWith(networkOnly(request));
    return;
  }

  // 3. 静态资源（CSS/JS/字体）
  if (isStaticResource(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 4. 图片资源（CDN 图片）
  if (isImageResource(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, { maxItems: IMAGE_CACHE_MAX_ITEMS }));
    return;
  }

  // 5. 其他请求：Network First
  event.respondWith(networkFirst(request));
});

// ==================== 缓存策略 ====================

/**
 * Cache First：优先缓存，缓存未命中则网络请求
 */
async function cacheFirst(request, cacheName, options = {}) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      // 克隆响应后再放入缓存
      cache.put(request, response.clone());

      // 如果设置了最大条目数，清理旧缓存
      if (options.maxItems) {
        await trimCache(cache, options.maxItems);
      }
    }
    return response;
  } catch {
    // 网络失败且无缓存，返回离线回退
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network First：优先网络，网络失败则回退缓存
 */
async function networkFirst(request, offlineFallback = null) {
  try {
    const response = await fetch(request);
    if (response.ok && request.url.startsWith(self.location.origin)) {
      // 更新静态缓存
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // 导航请求回退到离线页面
    if (offlineFallback) {
      const fallback = await caches.match(offlineFallback);
      if (fallback) return fallback;
    }

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network Only：仅网络请求（用于 API）
 */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(
      JSON.stringify({ error: 'offline', message: '当前处于离线状态' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ==================== 辅助函数 ====================

function isStaticResource(pathname) {
  return /\.(js|css|woff2?|ttf|otf|eot)(\?.*)?$/.test(pathname) ||
         pathname.startsWith('/_next/static/');
}

const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'ico', 'bmp'];
function isImageResource(request) {
  if (request.destination === 'image') return true;
  const url = new URL(request.url);
  const ext = url.pathname.split('.').pop()?.toLowerCase();
  return imageExtensions.includes(ext || '');
}

/**
 * 按 LRU 策略裁剪缓存
 */
async function trimCache(cache, maxItems) {
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;

  const deleteCount = keys.length - maxItems;
  await Promise.all(keys.slice(0, deleteCount).map((key) => cache.delete(key)));
}

/**
 * 清理过期的图片缓存
 */
async function cleanupImageCache() {
  const cache = await caches.open(IMAGE_CACHE);
  const keys = await cache.keys();
  const now = Date.now();

  await Promise.all(
    keys.map(async (request) => {
      const response = await cache.match(request);
      if (!response) return;

      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const age = now - new Date(dateHeader).getTime();
        if (age > IMAGE_CACHE_MAX_AGE) {
          await cache.delete(request);
        }
      }
    })
  );
}

// ==================== 消息处理 ====================
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
