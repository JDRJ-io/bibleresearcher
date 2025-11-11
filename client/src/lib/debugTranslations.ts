// DIAGNOSTIC ONLY - Memory leak detection and concurrent loading tracker
// This file provides real-time evidence of translation loading issues

interface LoadEvent {
  translationId: string;
  timestamp: number;
  stack: string;
  loadId: string;
  startTime: number;
  endTime?: number;
  mapSize?: number;
  fileSizeMB?: number;
  cacheHit?: boolean;
}

interface ConcurrentStats {
  activeLoads: Record<string, number>;
  loadHistory: LoadEvent[];
  bigMaps: number;
  globalRefs: string[];
  serviceWorkerActive: boolean;
  cachePatternMatch: boolean;
}

class TranslationDebugger {
  private activeLoads: Record<string, number> = {};
  private loadHistory: LoadEvent[] = [];
  private maxHistorySize = 100;

  startLoad(translationId: string): string {
    const loadId = `${translationId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const startTime = performance.now();
    
    // Track concurrent loads
    this.activeLoads[translationId] = (this.activeLoads[translationId] || 0) + 1;
    
    // Capture stack trace
    const stack = new Error().stack?.split('\n').slice(2, 8).join('\n') || 'unknown';
    
    const loadEvent: LoadEvent = {
      translationId,
      timestamp: Date.now(),
      stack,
      loadId,
      startTime
    };

    this.loadHistory.push(loadEvent);
    
    // Keep history manageable
    if (this.loadHistory.length > this.maxHistorySize) {
      this.loadHistory = this.loadHistory.slice(-this.maxHistorySize);
    }
    
    // 🚨 Log concurrent load warning
    if (this.activeLoads[translationId] > 1) {
      console.group(`🚨 [TX-DEBUG] CONCURRENT LOAD #${this.activeLoads[translationId]} for ${translationId}`);
      console.warn(`🔍 Load ID: ${loadId}`);
      console.warn(`📍 Stack trace:`, stack);
      console.warn(`⏱️  Started at: ${new Date().toISOString()}`);
      console.groupEnd();
    }
    
    console.count(`[TX-DEBUG] TOTAL LOADS for ${translationId}`);
    console.log(`[TX-DEBUG] START ${loadId}`);
    
    return loadId;
  }

  endLoad(translationId: string, loadId: string, options: {
    mapSize?: number;
    fileSizeMB?: number;
    cacheHit?: boolean;
    error?: string;
  } = {}) {
    const endTime = performance.now();
    
    // Find the load event and update it
    const loadEvent = this.loadHistory.find(event => event.loadId === loadId);
    if (loadEvent) {
      loadEvent.endTime = endTime;
      loadEvent.mapSize = options.mapSize;
      loadEvent.fileSizeMB = options.fileSizeMB;
      loadEvent.cacheHit = options.cacheHit;
    }

    this.activeLoads[translationId] = Math.max(0, (this.activeLoads[translationId] || 1) - 1);
    
    const duration = loadEvent ? (endTime - loadEvent.startTime).toFixed(1) : 'unknown';
    
    if (options.error) {
      console.error(`[TX-DEBUG] ERROR ${loadId}: ${options.error}`);
    } else {
      console.log(`[TX-DEBUG] COMPLETED ${loadId}: ${options.mapSize || 0} verses, ${options.fileSizeMB?.toFixed(2) || 0}MB, ${duration}ms, ${this.activeLoads[translationId]} still active`);
    }
  }

  checkServiceWorkerCache(): Promise<{active: boolean, hasTranslationCache: boolean}> {
    return new Promise(async (resolve) => {
      try {
        if (!('serviceWorker' in navigator)) {
          resolve({active: false, hasTranslationCache: false});
          return;
        }

        const registration = await navigator.serviceWorker.getRegistration();
        const active = !!registration?.active;

        if (!active) {
          resolve({active: false, hasTranslationCache: false});
          return;
        }

        // Check caches for translation data
        const cacheNames = await caches.keys();
        let hasTranslationCache = false;

        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          
          const translationRequests = requests.filter(req => 
            req.url.includes('/storage/v1/object/') && 
            req.url.includes('translations')
          );

          if (translationRequests.length > 0) {
            hasTranslationCache = true;
            console.log(`[TX-DEBUG] Found ${translationRequests.length} cached translations in ${cacheName}`);
            break;
          }
        }

        resolve({active, hasTranslationCache});
      } catch (error) {
        console.error('[TX-DEBUG] Error checking Service Worker:', error);
        resolve({active: false, hasTranslationCache: false});
      }
    });
  }

  checkCachePatternMatch(url: string): boolean {
    // 🚨 PHASE 0.2: Match both /sign/ and /public/ Supabase URLs for translations
    const urlObj = new URL(url);
    const matches = urlObj.hostname.endsWith('.supabase.co') &&
                   urlObj.pathname.startsWith('/storage/v1/object/') &&
                   /\/translations\/[^/]+\.txt$/i.test(urlObj.pathname);
    
    if (!matches) {
      console.warn(`[TX-DEBUG] ❌ SW CACHE PATTERN MISMATCH:`);
      console.warn(`  URL: ${url}`);
      console.warn(`  Issue: URL doesn't match Supabase translation pattern`);
    } else {
      console.log(`[TX-DEBUG] ✅ SW CACHE PATTERN MATCH: ${url}`);
    }
    
    return matches;
  }

  async countMemoryMaps(): Promise<{count: number, details: string[]}> {
    const details: string[] = [];
    let count = 0;

    try {
      // Check window globals
      const win = window as any;
      
      // Check globalKjvTextMap
      if (win.globalKjvTextMap instanceof Map && win.globalKjvTextMap.size > 0) {
        count++;
        details.push(`globalKjvTextMap: ${win.globalKjvTextMap.size} entries (${(win.globalKjvTextMap.size * 0.13).toFixed(1)}KB estimated)`);
      }

      // Check masterCache
      if (win.masterCache?.cache instanceof Map) {
        let cacheMapCount = 0;
        let totalCacheEntries = 0;
        
        win.masterCache.cache.forEach((entry: any, key: string) => {
          if (entry.data instanceof Map && entry.data.size > 1000) {
            cacheMapCount++;
            totalCacheEntries += entry.data.size;
            count++;
            details.push(`masterCache[${key}]: ${entry.data.size} entries (${(entry.data.size * 0.13).toFixed(1)}KB estimated)`);
          }
        });

        if (cacheMapCount === 0) {
          details.push(`masterCache: ${win.masterCache.cache.size} entries but no large Maps found`);
        }
      }

      // Check for other potential global Maps
      for (const key of Object.keys(win)) {
        if (key.includes('Map') && key !== 'globalKjvTextMap' && win[key] instanceof Map && win[key].size > 1000) {
          count++;
          details.push(`${key}: ${win[key].size} entries`);
        }
      }

    } catch (error) {
      details.push(`Error checking memory maps: ${error}`);
    }

    return {count, details};
  }

  async generateReport(): Promise<string> {
    const swStatus = await this.checkServiceWorkerCache();
    const memoryMaps = await this.countMemoryMaps();
    const recentLoads = this.loadHistory.slice(-10);

    const concurrentIssues = Object.entries(this.activeLoads).filter(([_, count]) => count > 1);
    const memoryLeakEstimate = memoryMaps.count * 4; // 4MB per translation map

    return `
=== TRANSLATION MEMORY LEAK DIAGNOSTIC REPORT ===
Generated: ${new Date().toISOString()}

🚨 CONCURRENT LOADING STATUS:
${Object.entries(this.activeLoads).length === 0 ? 
  '✅ No active loads currently' : 
  Object.entries(this.activeLoads).map(([id, count]) => 
    `  ${id}: ${count} active loads ${count > 1 ? '🚨 RACE CONDITION' : ''}`
  ).join('\n')}

${concurrentIssues.length > 0 ? 
  `⚠️  CONCURRENT LOAD ISSUES DETECTED:\n${concurrentIssues.map(([id, count]) => 
    `    - ${id}: ${count} simultaneous loads (causes ${count}x memory usage)`
  ).join('\n')}` : 
  '✅ No concurrent loading issues detected'}

🗄️ SERVICE WORKER CACHE STATUS:
  Active: ${swStatus.active ? '✅ Yes' : '❌ No'}
  Has Translation Cache: ${swStatus.hasTranslationCache ? '✅ Yes' : '❌ No - translations bypass cache'}
  
💾 MEMORY FOOTPRINT:
  Large Maps detected: ${memoryMaps.count} ${memoryMaps.count > 4 ? '🚨 EXCESSIVE' : memoryMaps.count > 2 ? '⚠️  HIGH' : '✅ NORMAL'}
  Estimated memory usage: ~${memoryLeakEstimate}MB in translation Maps
${memoryMaps.details.map(detail => `    - ${detail}`).join('\n')}

📊 RECENT LOAD HISTORY (last 10):
${recentLoads.length === 0 ? '  No recent loads' : recentLoads.map(load => {
  const duration = load.endTime ? `${(load.endTime - load.startTime).toFixed(1)}ms` : 'in progress';
  const cacheStatus = load.cacheHit ? '(cache hit)' : load.cacheHit === false ? '(cache miss)' : '(unknown)';
  return `  ${new Date(load.timestamp).toISOString()}: ${load.loadId} - ${duration} ${cacheStatus}`;
}).join('\n')}

🔍 LOAD PATTERN ANALYSIS:
  Total loads tracked: ${this.loadHistory.length}
  Cache hits: ${this.loadHistory.filter(l => l.cacheHit === true).length}
  Cache misses: ${this.loadHistory.filter(l => l.cacheHit === false).length}
  Average file size: ${this.loadHistory.filter(l => l.fileSizeMB).length > 0 ? 
    (this.loadHistory.filter(l => l.fileSizeMB).reduce((sum, l) => sum + (l.fileSizeMB || 0), 0) / 
     this.loadHistory.filter(l => l.fileSizeMB).length).toFixed(2) : 'unknown'}MB

🎯 RECOMMENDATIONS:
${memoryMaps.count > 4 ? '🚨 CRITICAL: Too many large Maps in memory - indicates memory leak' : ''}
${concurrentIssues.length > 0 ? '🚨 CRITICAL: Concurrent loading detected - race condition causing duplicates' : ''}
${!swStatus.hasTranslationCache ? '⚠️  SERVICE WORKER: Cache pattern not matching signed URLs' : ''}
${memoryMaps.count === 0 ? '✅ Memory usage looks normal' : ''}
${this.loadHistory.filter(l => l.cacheHit === true).length > this.loadHistory.filter(l => l.cacheHit === false).length ? '✅ Cache working effectively' : ''}

🛠️  SUGGESTED FIXES:
1. Fix Service Worker cache pattern to match /storage/v1/object/sign/ URLs
2. Implement promise deduplication to prevent concurrent loads
3. Clear global references (globalKjvTextMap) when switching translations
4. Add proper cache eviction with garbage collection triggers
    `;
  }

  clearAllReferences(): void {
    if (import.meta.env.MODE !== 'development') {
      console.warn('[TX-DEBUG] clearAllReferences only available in development mode');
      return;
    }

    console.warn('🧹 [TX-DEBUG] CLEARING ALL GLOBAL TRANSLATION REFERENCES');
    
    try {
      const win = window as any;
      
      // Clear known globals
      const beforeMaps = Object.keys(win).filter(key => win[key] instanceof Map && win[key].size > 1000).length;
      
      win.globalKjvTextMap = null;
      
      // Clear master cache
      if (win.masterCache?.cache?.clear) {
        win.masterCache.cache.clear();
        console.log('🗑️ [TX-DEBUG] Cleared masterCache');
      }
      
      // Force garbage collection if available
      if (win.gc) {
        win.gc();
        console.log('🗑️ [TX-DEBUG] Forced garbage collection');
      }
      
      // Check results
      setTimeout(async () => {
        const afterMaps = await this.countMemoryMaps();
        console.log(`🧹 [TX-DEBUG] Cleanup result: ${beforeMaps} → ${afterMaps.count} large Maps`);
      }, 100);
      
    } catch (error) {
      console.error('[TX-DEBUG] Error clearing references:', error);
    }
  }

  // Quick diagnostic commands for console
  getQuickStats(): void {
    console.log('=== QUICK TRANSLATION DEBUG STATS ===');
    console.log('Active loads:', this.activeLoads);
    console.log('Recent loads:', this.loadHistory.slice(-5));
    this.countMemoryMaps().then(maps => {
      console.log('Memory maps:', maps);
    });
    this.checkServiceWorkerCache().then(sw => {
      console.log('Service Worker:', sw);
    });
  }
}

// Create singleton instance
export const translationDebug = new TranslationDebugger();

// Make available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).translationDebug = translationDebug;
  (window as any).txDebug = translationDebug; // Shorter alias
  
  // Add quick console commands
  (window as any).txReport = () => translationDebug.generateReport().then(console.log);
  (window as any).txStats = () => translationDebug.getQuickStats();
  (window as any).txClear = () => translationDebug.clearAllReferences();
}