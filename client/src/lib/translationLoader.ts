// Translation loading utilities - uses secure Supabase loader
import { loadTranslationSecure, masterCache } from './supabaseClient';

export async function loadTranslation(translationId: string): Promise<Map<string, string>> {
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