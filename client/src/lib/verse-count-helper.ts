/**
 * Verse Count Helper - Integration between bible-reference-parser and existing verse keys system
 * 
 * This provides the keyExists implementation for the bible-reference-parser's getVerseCount functionality
 * using the existing verseKeys-canonical.json system.
 */

import { loadVerseKeysCanonical } from './verseKeysLoader';
import { createGetVerseCount, type BookCode } from './bible-reference-parser';

// Cache for the verse keys set for fast lookups
let verseKeysSet: Set<string> | null = null;

/**
 * Check if a verse key exists in the canonical verse keys
 */
export async function keyExists(key: string): Promise<boolean> {
  // Load and cache verse keys on first use
  if (!verseKeysSet) {
    const verseKeys = await loadVerseKeysCanonical();
    verseKeysSet = new Set(verseKeys);
  }
  
  return verseKeysSet.has(key);
}

/**
 * Create a configured getVerseCount function for the bible-reference-parser
 * This uses the existing verse keys system to determine chapter verse counts
 */
export function createBibleVerseCounter() {
  return createGetVerseCount(keyExists);
}

/**
 * Warm common chapters that are frequently searched
 * Call this during app initialization to pre-cache verse counts for popular chapters
 */
export async function warmPopularChapters() {
  const verseCounter = createBibleVerseCounter();
  
  // Popular chapters to pre-warm
  const popularChapters: Array<{ book: BookCode; chapter: number }> = [
    { book: "JHN", chapter: 3 },   // John 3 (John 3:16)
    { book: "PSA", chapter: 23 },  // Psalm 23
    { book: "PSA", chapter: 119 }, // Psalm 119 (longest chapter)
    { book: "GEN", chapter: 1 },   // Genesis 1
    { book: "MAT", chapter: 5 },   // Matthew 5 (Sermon on the Mount)
    { book: "ROM", chapter: 8 },   // Romans 8
    { book: "1CO", chapter: 13 },  // 1 Corinthians 13 (Love chapter)
    { book: "REV", chapter: 21 },  // Revelation 21
  ];
  
  await verseCounter.warmChapters(popularChapters);
  console.log('Pre-warmed verse counts for popular chapters');
  
  return verseCounter;
}