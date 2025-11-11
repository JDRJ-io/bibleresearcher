// client/src/lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ✅ Vite reads only VITE_ vars
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Missing Supabase environment variables');
}

// Singleton pattern - prevents multi-import duplication and undefined errors
let _sb: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (_sb) return _sb;
  
  _sb = createClient(supabaseUrl, supabaseAnon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // good default for SPA
    },
  });
  
  // DEV guard: catch any accidental second client creation
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const w = window as any;
    if (w.__sb && w.__sb !== _sb) {
      console.warn('⚠️ Multiple Supabase clients detected. Using the first one.');
    }
    w.__sb ??= _sb;
  }
  
  return _sb;
}

// Master cache with LRU eviction
interface CacheEntry {
  data: any;
  timestamp: number;
  accessCount: number;
}

class LRUCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 12; // Max 12 translations as per PR-B requirement
  
  get(key: string): any | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      entry.accessCount++;
      entry.timestamp = Date.now();
      return entry.data;
    }
    return undefined;
  }
  
  set(key: string, value: any): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // Find least recently used entry
      let oldestKey = '';
      let oldestTime = Infinity;
      
      this.cache.forEach((entry, k) => {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = k;
        }
      });
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      accessCount: 1
    });
  }
  
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  get size(): number {
    return this.cache.size;
  }
  
  // 🚨 PHASE 0.3: Add clear method for translation reference cleanup
  clear(): void {
    this.cache.clear();
  }
}

// Single master cache instance
export const masterCache = new LRUCache();

// 🚨 PHASE 0.1: Promise deduplication to prevent concurrent loads
const pendingPromises: Record<string, Promise<Map<string, string>>> = {};

// 🚨 PHASE 0.3: Clear translation refs to enable garbage collection
export function clearTranslationRefs(): void {
  console.log('[TX-CLEANUP] Clearing all translation references for garbage collection');
  
  // Clear master cache (LRU cache)
  masterCache.clear();
  
  // Clear global KJV reference (import dynamically to avoid circular deps)
  import('../hooks/useBibleData').then((module) => {
    if (module.clearGlobalKjvTextMap) {
      module.clearGlobalKjvTextMap();
    }
  }).catch(() => {
    // Fallback: try to clear global directly
    try {
      (globalThis as any).globalKjvTextMap = null;
    } catch (e) {
      // Silent fallback
    }
  });
  
  // Clear verse keys cache
  verseKeysCache = null;
  
  console.log('[TX-CLEANUP] Translation references cleared');
}

// Cache for verse keys
let verseKeysCache: string[] | null = null;

// Load verse keys from Supabase
export async function loadVerseKeys(): Promise<string[]> {
  if (verseKeysCache) return verseKeysCache;

  try {

    const { data, error } = await supabase().storage
      .from("anointed")
      .download("metadata/verseKeys-canonical.json");

    if (error) {
      console.error("Error downloading verse keys:", error);
      throw error;
    }

    const text = await data.text();
    const verseKeys = JSON.parse(text);

    verseKeysCache = verseKeys;

    return verseKeys;
  } catch (error) {
    console.error("Failed to load verse keys:", error);
    throw error;
  }
}

// Load translation with master cache and diagnostic tracking
export async function loadTranslationSecure(
  translationId: string,
): Promise<Map<string, string>> {
  // Import debug tools for tracking (only in development)
  const { translationDebug } = await import('./debugTranslations');
  
  const cacheKey = `translation-${translationId}`;
  
  // 🔍 DIAGNOSTIC: Track load start
  const loadId = translationDebug.startLoad(translationId);
  
  if (masterCache.has(cacheKey)) {
    console.log(`[TX-CACHE] HIT ${translationId} (${loadId})`);
    translationDebug.endLoad(translationId, loadId, { cacheHit: true });
    return masterCache.get(cacheKey);
  }

  // 🚨 PHASE 0.1: Check for pending promise to prevent concurrent loads
  if (translationId in pendingPromises) {
    console.log(`[TX-DEDUP] SHARING promise for ${translationId} (${loadId})`);
    translationDebug.endLoad(translationId, loadId, { cacheHit: true });
    return pendingPromises[translationId];
  }

  // 🚨 PHASE 0.1: Create and store promise to share with concurrent calls
  const loadPromise = (async (): Promise<Map<string, string>> => {
    try {
      const startTime = performance.now();

      console.log(`[TX-DIRECT-FETCH] Bypassing Supabase client, using direct public URL for ${translationId}`);
      
      // Use direct public URL instead of signed URL to bypass auth issues
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/anointed/translations/${translationId}.txt`;
      console.log(`[TX-PUBLIC-URL] ${publicUrl}`);
      
      // 🔍 DIAGNOSTIC: Check Service Worker cache pattern match
      const cachePatternMatch = translationDebug.checkCachePatternMatch(publicUrl);
      
      console.log(`[TX-FETCH] ${translationId} (${loadId})`);
      console.log(`[TX-URL] ${publicUrl}`);
      console.log(`[TX-SW] Pattern match: ${cachePatternMatch ? '✅ WILL CACHE' : '❌ CACHE MISS - /sign/ ≠ /public/'}`);

      // MEMORY FIX: Use 'no-store' to prevent browser from caching large translation files
      // This prevents unbounded HTTP cache growth (7GB+ memory issue)
      const response = await fetch(publicUrl, {
        cache: 'no-store'
      });
      if (!response.ok) {
        const error = `HTTP ${response.status}: ${response.statusText}`;
        translationDebug.endLoad(translationId, loadId, { error });
        throw new Error(error);
      }

      const text = await response.text();
      const fileSizeMB = text.length / 1e6;
      
      // 🔍 DIAGNOSTIC: Track file size and parsing
      console.log(`[TX-PARSE] ${translationId} (${loadId}): ${fileSizeMB.toFixed(2)}MB file`);
      
      const translationMap = new Map<string, string>();
      
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          const [verseId, ...textParts] = line.split('#');
          if (verseId && textParts.length > 0) {
            translationMap.set(verseId.trim(), textParts.join('#').trim());
          }
        }
      }

      masterCache.set(cacheKey, translationMap);
      
      const duration = performance.now() - startTime;
      console.log(`[TX-STORED] ${translationId} (${loadId}): ${translationMap.size} verses in ${duration.toFixed(1)}ms`);
      
      // 🔍 DIAGNOSTIC: Track completion
      translationDebug.endLoad(translationId, loadId, {
        mapSize: translationMap.size,
        fileSizeMB,
        cacheHit: false
      });

      return translationMap;
    } catch (error) {
      console.error(`Failed to load ${translationId}:`, error);
      translationDebug.endLoad(translationId, loadId, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    } finally {
      // 🚨 PHASE 0.1: Clean up pending promise (success or failure)
      delete pendingPromises[translationId];
      console.log(`[TX-CLEANUP] Removed pending promise for ${translationId}`);
    }
  })();

  // 🚨 PHASE 0.1: Store promise for sharing with concurrent calls
  pendingPromises[translationId] = loadPromise;
  console.log(`[TX-PENDING] Created promise for ${translationId} (${loadId})`);

  return loadPromise;
}

// Auth helper functions
export const signInWithMagicLink = async (email: string, displayName?: string) => {
  // Use full origin to survive Vercel preview URLs, etc.
  const redirectTo = `${window.location.origin}/auth/callback`
  
  const { data, error } = await supabase().auth.signInWithOtp({
    email,
    options: {
      data: displayName ? { display_name: displayName } : undefined,
      emailRedirectTo: redirectTo
    }
  })
  
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase().auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase().auth.getUser()
  return { user, error }
}

export const getSession = async () => {
  const { data: { session }, error } = await supabase().auth.getSession()
  return { session, error }
}

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase().auth.onAuthStateChange(callback)
}

// Service role client for backend operations
export const createSupabaseServiceClient = () => {
  return createClient(supabaseUrl, supabaseAnon, {
    auth: {
      persistSession: false
    }
  })
}