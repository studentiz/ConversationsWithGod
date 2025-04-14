// Service Worker for offline functionality

const CACHE_NAME = 'conversations-with-god-v1.0.0';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icons/favicon-32x32.png',
    './icons/apple-touch-icon.png',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './icons/maskable-icon.png'
];

// Install event - cache all essential resources
self.addEventListener('install', event => {
    // Use waitUntil to extend the lifetime of the install event
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS);
            })
            .then(() => {
                // Skip waiting to activate the service worker immediately
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Remove any outdated caches
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        // Take control of all clients immediately
        .then(() => self.clients.claim())
    );
});

// Fetch event - return cached responses or fetch new ones
self.addEventListener('fetch', event => {
    // Only handle GET requests - ignore POST/PUT etc.
    if (event.request.method !== 'GET') return;
    
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;
    
    event.respondWith(
        // Try the cache first
        caches.match(event.request)
            .then(cachedResponse => {
                // Return cached response if found
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Check for valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response - one to return, one to cache
                        const responseToCache = response.clone();

                        // Cache the fetched response for future
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // If fetch fails (offline), return a generic fallback
                        // For HTML pages, return the index.html page
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('./index.html');
                        }
                        
                        // You could return a generic offline image/resource for other types
                        // return caches.match('./offline-resource.png');
                    });
            })
    );
});

// Push notification event handler (for future use)
self.addEventListener('push', event => {
    // This would be used if you add notification features
    if (!event.data) return;
    
    const notification = event.data.json();
    
    self.registration.showNotification(
        notification.title, {
            body: notification.body,
            icon: './icons/icon-192x192.png',
            badge: './icons/favicon-32x32.png'
        }
    );
});

// Notification click handler (for future use)
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});
