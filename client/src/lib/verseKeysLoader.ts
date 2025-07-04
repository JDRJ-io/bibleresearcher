// Import verse keys directly for instant loading
import verseKeysData from '@/data/verseKeys.json';

// Cache the parsed verse keys
let cachedVerseKeys: string[] | null = null;

export function getVerseKeys(): string[] {
  if (!cachedVerseKeys) {
    cachedVerseKeys = verseKeysData as string[];
    console.log(`Loaded ${cachedVerseKeys.length} verse keys from embedded data`);
  }
  return cachedVerseKeys;
}

export function getVerseCount(): number {
  return getVerseKeys().length;
}

export function getVerseKeyByIndex(index: number): string | null {
  const keys = getVerseKeys();
  if (index < 0 || index >= keys.length) return null;
  return keys[index];
}

export function findVerseIndexByKey(key: string): number {
  const keys = getVerseKeys();
  return keys.indexOf(key);
}

// Helper to convert verse key to display reference
export function keyToReference(key: string): string {
  // Convert "Gen.1:1" to "Gen 1:1"
  return key.replace('.', ' ');
}

// Helper to parse verse key
export function parseVerseKey(key: string): { book: string; chapter: number; verse: number } | null {
  const match = key.match(/^(\w+)\.(\d+):(\d+)$/);
  if (!match) return null;
  
  const [, book, chapter, verse] = match;
  return {
    book,
    chapter: parseInt(chapter),
    verse: parseInt(verse)
  };
}