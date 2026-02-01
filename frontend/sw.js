const CACHE_NAME = 'participa-df-v2'; // Incremented version
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/categories.json',
    './manifest.json'
];

// Install Event
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: clearing old cache', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch Event - Network First Strategy
// This ensures the latest version is served if the user is online
self.addEventListener('fetch', (e) => {
    // Only intercept GET requests
    if (e.request.method !== 'GET') return;

    // Skip API calls - always network
    if (e.request.url.includes('/api/')) return;

    e.respondWith(
        fetch(e.request)
            .then((res) => {
                // If successful response, clone it to cache
                const resClone = res.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, resClone);
                });
                return res;
            })
            .catch(() => caches.match(e.request)) // Fallback to cache if network fails
    );
});
