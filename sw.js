self.addEventListener('install', (e) => {
  console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (e) => {
  // يمكنك لاحقاً إضافة ميزات التصفح بدون إنترنت هنا
});
