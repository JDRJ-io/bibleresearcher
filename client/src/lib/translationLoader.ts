
// DEPRECATED: Use BibleDataAPI.loadTranslation() directly instead

console.warn('⚠️ translationLoader.ts is deprecated. Use BibleDataAPI.loadTranslation() directly.');

// All methods redirect to BibleDataAPI to prevent legacy usage
export async function loadMultipleTranslations(translationIds: string[]): Promise<Map<string, Map<string, string>>> {
  console.warn('⚠️ loadMultipleTranslations is deprecated. Use BibleDataAPI.loadTranslation() directly.');
  
  // Redirect to BibleDataAPI
  const { loadTranslation } = await import('@/data/BibleDataAPI');
  const result = new Map<string, Map<string, string>>();
  
  for (const id of translationIds) {
    try {
      const translationMap = await loadTranslation(id);
      result.set(id, translationMap);
    } catch (error) {
      console.error(`Failed to load ${id} via BibleDataAPI:`, error);
    }
  }
  
  return result;
}

export function getVerseText(translationMap: Map<string, string>, reference: string): string {
  console.warn('⚠️ getVerseText from translationLoader is deprecated. Use BibleDataAPI.loadTranslation() directly.');
  return translationMap.get(reference) || `[${reference} - Use BibleDataAPI]`;
}

// Legacy method - DEPRECATED
export async function loadTranslation(translationId: string): Promise<Map<string, string>> {
  console.warn('⚠️ loadTranslation from translationLoader is deprecated. Use BibleDataAPI.loadTranslation() directly.');
  
  // Redirect to BibleDataAPI
  const { loadTranslation: apiLoadTranslation } = await import('@/data/BibleDataAPI');
  return apiLoadTranslation(translationId);
}
