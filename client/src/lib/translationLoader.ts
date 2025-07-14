// Translation loading utilities - uses secure Supabase loader
import { loadTranslationSecure } from './supabaseClient';

const TRANSLATION_CACHE = new Map<string, Map<string, string>>();

export async function loadTranslation(translationId: string): Promise<Map<string, string>> {
  // Check cache first
  if (TRANSLATION_CACHE.has(translationId)) {
    return TRANSLATION_CACHE.get(translationId)!;
  }

  try {
    // Use secure Supabase loader
    const textMap = await loadTranslationSecure(translationId);
    
    // Cache the loaded translation
    TRANSLATION_CACHE.set(translationId, textMap);
    
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
  // Try different reference formats
  const formats = [
    reference,
    reference.replace('.', ' '),
    reference.replace(/\s/g, '.'),
    reference.replace(/\./g, ' ')
  ];
  
  for (const format of formats) {
    if (translationMap.has(format)) {
      return translationMap.get(format)!;
    }
  }
  
  return `[${reference} - Loading...]`;
}