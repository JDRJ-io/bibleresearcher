// DEPRECATED: Use BibleDataAPI.loadTranslation() directly instead

console.warn('⚠️ translationLoader.ts is deprecated. Use BibleDataAPI.loadTranslation() directly.');

export async function loadMultipleTranslations(translationIds: string[]): Promise<Map<string, Map<string, string>>> {
  console.warn('⚠️ loadMultipleTranslations is deprecated. Use BibleDataAPI.loadTranslation() directly.');
  return new Map();
}

export function getVerseText(translationMap: Map<string, string>, reference: string): string {
  console.warn('⚠️ getVerseText from translationLoader is deprecated. Use BibleDataAPI.loadTranslation() directly.');
  return `[${reference} - Use BibleDataAPI]`;
}