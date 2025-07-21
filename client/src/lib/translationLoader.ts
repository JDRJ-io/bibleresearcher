// Translation loading utilities - uses secure Supabase loader
import { masterCache } from './supabaseClient';

// REMOVED: Legacy loading system - use ONLY BibleDataAPI facade per documentation
// All translation loading must go through BibleDataAPI.loadTranslation() only

export async function loadMultipleTranslations(translationIds: string[]): Promise<Map<string, Map<string, string>>> {
  const results = new Map<string, Map<string, string>>();
  
  // Use ONLY BibleDataAPI facade - single source of truth
  const { loadTranslation } = await import('@/data/BibleDataAPI');
  
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