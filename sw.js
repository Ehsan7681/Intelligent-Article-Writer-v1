// نام Cache برای ذخیره فایل‌های برنامه
const CACHE_NAME = 'article-writer-v2';
const STATIC_CACHE = 'static-cache-v2';
const DYNAMIC_CACHE = 'dynamic-cache-v2';

// لیست فایل‌هایی که باید ذخیره شوند
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  './icons/icon-base.svg',
  './icons/icon-192x192.svg',
  './icons/icon-512x512.svg',
  './icons/splash.svg',
  './favicon.ico',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font/dist/Vazir.woff2',
  'https://unpkg.com/docx@7.8.2/build/index.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
];

// نصب Service Worker و ذخیره فایل‌های اصلی
self.addEventListener('install', event => {
  console.log('[Service Worker] نصب...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[Service Worker] ذخیره‌سازی فایل‌های استاتیک...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] نصب با موفقیت انجام شد');
        return self.skipWaiting(); // اطمینان از فعال شدن سریع service worker
      })
  );
});

// به‌روزرسانی Service Worker و حذف cache‌های قدیمی
self.addEventListener('activate', event => {
  console.log('[Service Worker] فعال‌سازی...');
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log('[Service Worker] حذف cache قدیمی:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] ادعای کنترل کلاینت‌ها');
        return self.clients.claim(); // ادعای کنترل تمام کلاینت‌های باز
      })
  );
});

// استراتژی Cache-First برای بارگذاری فایل‌ها
self.addEventListener('fetch', event => {
  // برای درخواست‌های API از استراتژی Network-First استفاده می‌کنیم
  if (event.request.url.includes('openrouter.ai') || event.request.url.includes('openai.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // برگرداندن فایل از cache اگر وجود داشته باشد
        if (response) {
          return response;
        }
        
        // در غیر این صورت، درخواست را به سرور ارسال می‌کنیم
        return fetch(event.request)
          .then(response => {
            // بررسی اعتبار پاسخ
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // کپی پاسخ برای ذخیره در cache
            const responseToCache = response.clone();
            
            // ذخیره نسخه جدید در cache دینامیک
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('[Service Worker] ذخیره فایل جدید در cache:', event.request.url);
              });
            
            return response;
          })
          .catch(error => {
            console.error('[Service Worker] خطا در دریافت:', error);
            
            // برای درخواست‌های HTML، ارائه صفحه آفلاین
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// مدیریت پیام‌ها از صفحه
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ارائه دسترسی آفلاین
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html');
        })
    );
  }
}); 