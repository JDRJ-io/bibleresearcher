import { logger } from './logger';

interface CachedCrossRefText {
  verseKey: string;
  translation: string;
  targetVerses: Set<string>;
  lastAccessTime: number;
}

class CrossRefCacheManager {
  private cache = new Map<string, CachedCrossRefText>();
  private currentWindow = new Set<string>();
  
  private getCacheKey(verseKey: string, translation: string): string {
    return `${verseKey}:${translation}`;
  }
  
  trackCrossRefTexts(verseKey: string, translation: string, targetVerses: string[]) {
    const key = this.getCacheKey(verseKey, translation);
    this.cache.set(key, {
      verseKey,
      translation,
      targetVerses: new Set(targetVerses),
      lastAccessTime: Date.now()
    });
  }
  
  updateActiveWindow(verseKeys: string[]) {
    const newWindow = new Set(verseKeys);
    const oldWindow = this.currentWindow;
    
    const versesExited = Array.from(oldWindow).filter(v => !newWindow.has(v));
    
    if (versesExited.length > 0) {
      logger.debug('CACHE', `Clearing cross-ref texts for ${versesExited.length} verses that exited window`);
      
      for (const verseKey of versesExited) {
        const cacheEntries = Array.from(this.cache.entries());
        for (const [cacheKey, cached] of cacheEntries) {
          if (cached.verseKey === verseKey) {
            this.cache.delete(cacheKey);
          }
        }
      }
    }
    
    this.currentWindow = newWindow;
  }
  
  getCachedTargets(verseKey: string, translation: string): Set<string> | null {
    const key = this.getCacheKey(verseKey, translation);
    const cached = this.cache.get(key);
    
    if (cached) {
      cached.lastAccessTime = Date.now();
      return cached.targetVerses;
    }
    
    return null;
  }
  
  clear() {
    this.cache.clear();
    this.currentWindow.clear();
    logger.debug('CACHE', 'Cross-ref cache completely cleared');
  }
  
  getStats() {
    let totalTargets = 0;
    const cacheValues = Array.from(this.cache.values());
    for (const cached of cacheValues) {
      totalTargets += cached.targetVerses.size;
    }
    
    return {
      cachedVerses: this.cache.size,
      totalTargetVerses: totalTargets,
      windowSize: this.currentWindow.size
    };
  }
}

export const crossRefCacheManager = new CrossRefCacheManager();
