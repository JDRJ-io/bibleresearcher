// DEPRECATED: Use BibleDataAPI.loadVerseKeys() directly instead

console.warn('⚠️ verseKeysLoader.ts is deprecated. Use BibleDataAPI.loadVerseKeys() directly.');

export const loadVerseKeys = async () => {
  console.warn('⚠️ loadVerseKeys is deprecated. Use BibleDataAPI.loadVerseKeys() instead.');
  const { loadVerseKeys: apiLoadVerseKeys } = await import('@/data/BibleDataAPI');
  return apiLoadVerseKeys();
};

export async function loadVerseKeysCanonical(): Promise<string[]> {
  console.warn('⚠️ loadVerseKeysCanonical is deprecated. Use BibleDataAPI.loadVerseKeys() instead.');
  const { loadVerseKeys: apiLoadVerseKeys } = await import('@/data/BibleDataAPI');
  return apiLoadVerseKeys('canonical');
}

export function getVerseKeyByIndex(index: number): string {
  console.warn('⚠️ getVerseKeyByIndex is deprecated.');
  return `Unknown.${index}:1`;
}

/**
 * Create verse objects from verse keys
 * This creates the skeleton structure that other data plugs into
 */
export function createVerseObjectsFromKeys(verseKeys: string[]): BibleVerse[] {
  console.log("🏗️ Creating verse objects from master key index...");

  const verses: BibleVerse[] = verseKeys.map((key, index) => {
    const [bookChapter, verseNum] = key.split(':');
    const [book, chapter] = bookChapter.split('.');

    return {
      id: `${book.toLowerCase()}-${chapter}-${verseNum}-${index}`,
      index: index,
      book: book,
      chapter: parseInt(chapter),
      verse: parseInt(verseNum),
      reference: key.replace('.', ' '), // Convert Gen.1:1 to Gen 1:1
      text: {}, // Empty - text will be loaded on demand
      crossReferences: [],
      strongsWords: [],
      labels: [],
      contextGroup: "standard"
    };
  });

  console.log(`🏗️ Created ${verses.length} verse objects from key index`);
  return verses;
}

/**
 * Helper functions for VirtualBibleTable compatibility
 */
export function getVerseCount(): number {
  console.warn('⚠️ getVerseCount is deprecated.');
  return 31102; // Expected total verse count
}

export function getVerseKeys(): string[] {
  console.warn('⚠️ getVerseKeys is deprecated.');
  return [];
}

export async function loadVerseKeysChronological(): Promise<string[]> {
  console.warn('⚠️ loadVerseKeysChronological is deprecated. Use BibleDataAPI.loadVerseKeys() instead.');
  const { loadVerseKeys: apiLoadVerseKeys } = await import('@/data/BibleDataAPI');
  return apiLoadVerseKeys('chronological');
}