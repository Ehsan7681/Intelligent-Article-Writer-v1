// نام Cache برای ذخیره فایل‌های برنامه
const CACHE_NAME = 'article-writer-v1';

// لیست فایل‌هایی که باید ذخیره شوند
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-base.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/icons/splash.svg',
  '/favicon.ico',
  'https://unpkg.com/docx@7.8.2/build/index.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
];

// نصب Service Worker و ذخیره فایل‌های اصلی
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('فایل‌ها در حال ذخیره‌سازی...');
        return cache.addAll(urlsToCache);
      })
  );
});

// استراتژی Cache-First برای بارگذاری فایل‌ها
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // برگرداندن فایل از cache اگر وجود داشته باشد
        if (response) {
          return response;
        }
        
        // در غیر این صورت، درخواست را به سرور ارسال می‌کنیم
        return fetch(event.request).then(
          response => {
            // بررسی اعتبار پاسخ
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // کپی پاسخ برای ذخیره در cache
            const responseToCache = response.clone();
            
            // ذخیره نسخه جدید در cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }
        );
      })
      .catch(error => {
        // خطای احتمالی شبکه
        console.error('خطا در دریافت منابع:', error);
      })
  );
});

// به‌روزرسانی Service Worker و حذف cache‌های قدیمی
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // حذف cache‌های قدیمی
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 