import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

// Precache and route
precacheAndRoute(self.__WB_MANIFEST);

// Clean up outdated caches
cleanupOutdatedCaches();

// Take control of all open clients
self.skipWaiting();
clientsClaim();

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'anointed-sync') {
    event.waitUntil(
      // Dynamic import to load the sync logic
      import('./offline/queueSync.js').then(module => module.pushPending())
        .catch(error => console.error('Background sync failed:', error))
    );
  }
});

// Handle fetch events for offline support
self.addEventListener('fetch', (event) => {
  // Let workbox handle the caching strategy
  // Additional custom logic can be added here if needed
});