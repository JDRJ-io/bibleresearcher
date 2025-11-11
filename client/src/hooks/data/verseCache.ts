/**
 * Verse cache with direction-biased eviction and in-flight tracking
 * Prevents evicting verses in scroll direction during fast scrolls
 * 
 * MEMORY OPTIMIZATION: Cache is now keyed by translation code + verse index
 * to support multiple translations without overwriting each other
 */

export type CacheStatus = 'ready' | 'loading' | 'error';

export type CacheEntry = { 
  text?: string; 
  status: CacheStatus; 
  ts: number; 
  pinned?: boolean;
};

// Cache keyed by "translationCode-verseIndex" to support multiple translations
const cache = new Map<string, CacheEntry>();
const inFlight = new Set<string>();

// React subscription support - notify components when verses become ready
let cacheVersion = 0;
const listeners = new Set<() => void>();

/**
 * Create cache key from translation code and verse index
 */
function cacheKey(translationCode: string, verseIndex: number): string {
  return `${translationCode}-${verseIndex}`;
}

export const verseCache = {
  get: (translationCode: string, i: number) => cache.get(cacheKey(translationCode, i)),
  
  set: (translationCode: string, i: number, e: CacheEntry) => {
    cache.set(cacheKey(translationCode, i), e);
    // Notify React components when verse becomes ready
    if (e.status === 'ready') {
      cacheVersion++;
      listeners.forEach(fn => fn());
    }
  },
  
  has: (translationCode: string, i: number) => cache.has(cacheKey(translationCode, i)),
  
  markPinned(translationCode: string, range: [number, number]) {
    for (let i = range[0]; i <= range[1]; i++) {
      const e = cache.get(cacheKey(translationCode, i));
      if (e) e.pinned = true;
    }
  },
  
  clearPins() { 
    Array.from(cache.values()).forEach(e => e.pinned = false);
  },
  
  size: () => cache.size,
  inFlight,
  
  // Helper to check/manage in-flight status with translation code
  isInFlight: (translationCode: string, i: number) => inFlight.has(cacheKey(translationCode, i)),
  markInFlight: (translationCode: string, i: number) => inFlight.add(cacheKey(translationCode, i)),
  clearInFlight: (translationCode: string, i: number) => inFlight.delete(cacheKey(translationCode, i)),
  
  // React 18 useSyncExternalStore interface
  subscribe: (callback: () => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
  
  getSnapshot: () => cacheVersion,
};

/**
 * Update access time for cache entry (LRU tracking)
 */
export function touch(translationCode: string, idx: number) {
  const e = verseCache.get(translationCode, idx);
  if (e) e.ts = performance.now();
}

/**
 * Schedule direction-biased cache eviction
 * Keeps verses in scroll direction, evicts from opposite direction first
 */
export function scheduleEviction(opts: {
  translationCode: string;
  forwardBackground: [number, number];
  backwardBackground: [number, number];
  highWater: number;
  target: number;
  ttlMs?: number;
}) {
  const { translationCode, forwardBackground, backwardBackground, highWater, target, ttlMs = 0 } = opts;
  
  if (cache.size <= highWater) return;
  
  const run = () => doEvict(translationCode, forwardBackground, backwardBackground, target, ttlMs);
  
  // Use requestIdleCallback if available, otherwise setTimeout
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(run, { timeout: 100 });
  } else {
    setTimeout(run, 16);
  }
}

/**
 * Perform direction-biased eviction
 * Priority (lowest to highest):
 * 1. Expired entries in backward trail
 * 2. Old entries in backward trail
 * 3. Expired entries not in either direction
 * 4. Old entries not in either direction
 * Never evicts: pinned, in-flight, or forward direction entries
 */
function doEvict(
  translationCode: string,
  fwd: [number, number], 
  back: [number, number], 
  target: number, 
  ttlMs: number
) {
  const now = performance.now();
  const keepFwd = toSet(fwd);
  const keepBack = toSet(back);
  const trailing: Array<[string, CacheEntry]> = [];
  const other: Array<[string, CacheEntry]> = [];

  Array.from(cache.entries()).forEach(([key, e]) => {
    // Only evict entries for this translation
    if (!key.startsWith(`${translationCode}-`)) return;
    
    // Extract verse index from key
    const verseIdx = parseInt(key.split('-')[1]);
    
    // Never evict pinned or in-flight
    if (e.pinned) return;
    if (verseCache.inFlight.has(key)) return;
    
    // Never evict forward direction (scroll destination)
    if (keepFwd.has(verseIdx)) return;
    
    const tuple: [string, CacheEntry] = [key, e];
    
    // Categorize: backward trail vs other
    if (keepBack.has(verseIdx)) trailing.push(tuple);
    else other.push(tuple);
  });

  // Sort by LRU (oldest first)
  const sortLRU = (a: [string, CacheEntry], b: [string, CacheEntry]) => 
    a[1].ts - b[1].ts;
  trailing.sort(sortLRU);
  other.sort(sortLRU);

  // Check if entry is expired
  const expired = (x: [string, CacheEntry]) => 
    ttlMs && (now - x[1].ts) > ttlMs;

  // Eviction order: expired trailing, all trailing, expired other, all other
  const evictionOrder = [
    ...trailing.filter(expired),
    ...trailing,
    ...other.filter(expired),
    ...other,
  ];

  // Evict until we hit target size
  for (const [key] of evictionOrder) {
    if (cache.size <= target) break;
    cache.delete(key);
  }
}

/**
 * Convert range to Set for fast lookup
 */
function toSet([a, b]: [number, number]): Set<number> {
  const s = new Set<number>();
  for (let i = a; i <= b; i++) s.add(i);
  return s;
}

/**
 * Check if a verse is ready (fully loaded) in the cache
 * Returns true only if the verse text is loaded and status is 'ready'
 * Used by two-phase rendering to gate content mounting
 */
export function isVerseReady(index: number, translation: string): boolean {
  const entry = verseCache.get(translation, index);
  return entry?.status === 'ready' && entry?.text !== undefined;
}
