// DEPRECATED: Use BibleDataAPI.loadVerseKeys() directly instead

console.warn('⚠️ verseKeysLoader.ts is deprecated. Use BibleDataAPI.loadVerseKeys() directly.');

// Cache for backwards compatibility
let cachedVerseKeys: string[] | null = null;

// All methods redirect to BibleDataAPI to prevent legacy usage
export async function getVerseKeys(): Promise<string[]> {
  console.warn('⚠️ getVerseKeys is deprecated. Use BibleDataAPI.loadVerseKeys() directly.');

  if (cachedVerseKeys) return cachedVerseKeys;

  // Redirect to BibleDataAPI
  const { loadVerseKeys } = await import('@/data/BibleDataAPI');
  cachedVerseKeys = await loadVerseKeys();
  return cachedVerseKeys;
}

export function getVerseCount(): number {
  console.warn('⚠️ getVerseCount is deprecated. Use BibleDataAPI.loadVerseKeys().length directly.');
  return cachedVerseKeys?.length || 0;
}

export function getVerseKeyByIndex(index: number): string {
  console.warn('⚠️ getVerseKeyByIndex is deprecated. Use BibleDataAPI.loadVerseKeys()[index] directly.');
  return cachedVerseKeys?.[index] || '';
}

// Legacy method - DEPRECATED
export async function loadVerseKeys(): Promise<string[]> {
  console.warn('⚠️ loadVerseKeys from verseKeysLoader is deprecated. Use BibleDataAPI.loadVerseKeys() directly.');

  // Redirect to BibleDataAPI
  const { loadVerseKeys: apiLoadVerseKeys } = await import('@/data/BibleDataAPI');
  return apiLoadVerseKeys();
}