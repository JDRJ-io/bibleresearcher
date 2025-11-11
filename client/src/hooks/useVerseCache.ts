import { useRef, useCallback } from "react";

type CacheEntry = {
  verseKey: string;
  lastAccess: number;
  data: any; // verse text data
};

export function useVerseCache() {
  const cacheRef = useRef<Map<number, CacheEntry>>(new Map());
  const lastCleanupRef = useRef(Date.now());

  const ensureCacheRange = useCallback((start: number, end: number, chunkSize: number) => {
    const cache = cacheRef.current;
    const now = Date.now();
    
    
    // Check what's missing in the range
    const missing: number[] = [];
    for (let i = start; i <= end; i++) {
      if (!cache.has(i)) {
        missing.push(i);
      } else {
        // Update access time for existing entries
        const entry = cache.get(i)!;
        entry.lastAccess = now;
      }
    }

    if (missing.length === 0) {
      return;
    }

    // For now, create placeholder entries - in a real implementation, 
    // this would trigger actual verse loading
    missing.forEach(index => {
      cache.set(index, {
        verseKey: `verse-${index}`,
        lastAccess: now,
        data: null // Would be actual verse data
      });
    });
  }, []);

  const evictCacheIfNeeded = useCallback((maxSize: number) => {
    const cache = cacheRef.current;
    
    if (cache.size <= maxSize) return;

    const now = Date.now();
    // Only cleanup every 5 seconds to avoid thrashing
    if (now - lastCleanupRef.current < 5000) return;
    
    
    // Sort by last access time (LRU)
    const entries = Array.from(cache.entries()).sort(
      (a, b) => a[1].lastAccess - b[1].lastAccess
    );
    
    // Remove oldest entries until we're under the limit
    const toRemove = cache.size - maxSize;
    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0]);
    }
    
    lastCleanupRef.current = now;
  }, []);

  const getFromCache = useCallback((index: number) => {
    const cache = cacheRef.current;
    const entry = cache.get(index);
    if (entry) {
      entry.lastAccess = Date.now();
      return entry.data;
    }
    return null;
  }, []);

  const isInCache = useCallback((index: number) => {
    return cacheRef.current.has(index);
  }, []);

  const getCacheStats = useCallback(() => {
    return {
      size: cacheRef.current.size,
      oldestAccess: Math.min(...Array.from(cacheRef.current.values()).map(e => e.lastAccess)),
      newestAccess: Math.max(...Array.from(cacheRef.current.values()).map(e => e.lastAccess))
    };
  }, []);

  return {
    ensureCacheRange,
    evictCacheIfNeeded,
    getFromCache,
    isInCache,
    getCacheStats
  };
}