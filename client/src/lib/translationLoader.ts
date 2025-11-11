// Translation loading utilities - Universal promise deduplication for translation loads
import { loadTranslationSecure, masterCache } from './supabaseClient';
import { count } from './counters';

const pending: Record<string, Promise<Map<string, string>>> = {};

export async function loadTranslationOnce(code: string): Promise<Map<string, string>> {
  const cacheKey = `translation-${code}`;

  // 1) If already in memory cache, return it (keep existing LRU contract)
  if (masterCache.has(cacheKey)) return masterCache.get(cacheKey);

  // 2) If a load is already in flight for this code, await it
  if (code in pending) return pending[code];

  // 3) Start exactly one load and share its promise
  pending[code] = (async () => {
    count(`fetchTranslation:${code}`);
    const map = await loadTranslationSecure(code);  // existing full-file fetch+parse
    masterCache.set(cacheKey, map);
    return map;
  })();

  try {
    return await pending[code];
  } finally {
    delete pending[code]; // always clear
  }
}

// Legacy fallback function (for rollback if needed)
async function legacyLoadTranslation(translationId: string): Promise<Map<string, string>> {
  const cacheKey = `translation-${translationId}`;
  
  // Check master cache first
  if (masterCache.has(cacheKey)) {
    return masterCache.get(cacheKey)!;
  }

  try {
    // Use secure Supabase loader (which also uses master cache)
    const textMap = await loadTranslationSecure(translationId);
    
    return textMap;
  } catch (error) {
    console.error(`Failed to load ${translationId} translation:`, error);
    return new Map();
  }
}

// Feature flag for easy rollback
const USE_UNIFIED_LOADER = true;
export const loadTranslation = USE_UNIFIED_LOADER ? loadTranslationOnce : legacyLoadTranslation;

export async function loadMultipleTranslations(translationIds: string[]): Promise<Map<string, Map<string, string>>> {
  const results = new Map<string, Map<string, string>>();
  
  // Load translations in parallel
  const promises = translationIds.map(async (id) => {
    const textMap = await loadTranslation(id);
    results.set(id, textMap);
  });
  
  await Promise.all(promises);
  return results;
}

export function getVerseText(
  translationMap: Map<string, string>, 
  reference: string
): string {
  // OPTIMIZATION: Direct lookup with dot format - no conversion needed
  const text = translationMap.get(reference);
  return text || `[${reference} - Loading...]`;
}

export async function batchLoadVerses(
  verseKeys: string[],
  translationCode: string
): Promise<Map<string, string>> {
  const translationMap = await loadTranslationOnce(translationCode);
  
  const batchResult = new Map<string, string>();
  for (const verseKey of verseKeys) {
    const text = translationMap.get(verseKey);
    if (text) {
      batchResult.set(verseKey, text);
    }
  }
  
  return batchResult;
}