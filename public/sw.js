// Service Worker for offline support
const CACHE_NAME = 'anointed-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/assets/index.css',
  'translations/*.json.gz', 
  'assets/**/*', 
  'index.html', 
  '**/*.js', 
  '**/*.css'
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Background sync event - push pending data
self.addEventListener('sync', (event) => {
  if (event.tag === 'anointed-sync') {
    event.waitUntil(pushPending());
  }
});

// Push pending data to Supabase
async function pushPending() {
  const db = await import('./src/offline/offlineDB.js');
  const pendingNotes = await db.db.notes.where('pending').equals(true).toArray();
  
  for (const note of pendingNotes) {
    try {
      // Push to Supabase
      console.log('Syncing note:', note.id);
    } catch (error) {
      console.log('Sync failed for note:', note.id, error);
    }
  }
}