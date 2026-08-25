const CACHE_NAME = 'estudai-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './js/app.js',
  './js/db.js',
  './manifest.json',
  './images/icon-192.png', 
  './images/icon-512.png'  
];

// Instala o Service Worker e salva os arquivos no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Responde com o cache se o usuário estiver offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});