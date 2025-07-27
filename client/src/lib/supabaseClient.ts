import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

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
        console.log(`🗑️ LRU evicted: ${oldestKey}`);
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
  
  get size(): number {
    return this.cache.size;
  }
}

// Single master cache instance
export const masterCache = new LRUCache();

// Cache for verse keys
let verseKeysCache: string[] | null = null;

// Load verse keys from Supabase
export async function loadVerseKeys(): Promise<string[]> {
  if (verseKeysCache) return verseKeysCache;

  try {
    console.log("Loading verse keys from private Supabase bucket...");

    const { data, error } = await supabase.storage
      .from("anointed")
      .download("metadata/verseKeys-canonical.json");

    if (error) {
      console.error("Error downloading verse keys:", error);
      throw error;
    }

    const text = await data.text();
    const verseKeys = JSON.parse(text);

    verseKeysCache = verseKeys;
    console.log(`Loaded ${verseKeys.length} verse keys from private bucket`);

    return verseKeys;
  } catch (error) {
    console.error("Failed to load verse keys:", error);
    throw error;
  }
}

// Load translation with master cache
export async function loadTranslationSecure(
  translationId: string,
): Promise<Map<string, string>> {
  const cacheKey = `translation-${translationId}`;
  
  if (masterCache.has(cacheKey)) {
    console.log(`✅ Cached translation: ${translationId}`);
    return masterCache.get(cacheKey);
  }

  try {
    console.log(`Loading ${translationId} from private Supabase bucket...`);

    const { data: signedData, error: signError } = await supabase.storage
      .from("anointed")
      .createSignedUrl(`translations/${translationId}.txt`, 600);

    if (signError) {
      console.error(`Error creating signed URL for ${translationId}:`, signError);
      throw signError;
    }

    const response = await fetch(signedData.signedUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
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
    console.log(`${translationId} loaded with ${translationMap.size} verses from private bucket`);

    return translationMap;
  } catch (error) {
    console.error(`Failed to load ${translationId}:`, error);
    throw error;
  }
}

// Auth helper functions
export const signInWithMagicLink = async (email: string, displayName?: string) => {
  // Use full origin to survive Vercel preview URLs, etc.
  const redirectTo = `${window.location.origin}/auth/callback`
  
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: displayName ? { display_name: displayName } : undefined,
      emailRedirectTo: redirectTo
    }
  })
  
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

// Service role client for backend operations
export const createSupabaseServiceClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  })
}