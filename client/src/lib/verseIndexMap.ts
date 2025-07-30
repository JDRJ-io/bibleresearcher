/**
 * Fast Verse Index Lookup - Performance Optimization
 * 
 * Creates a Map for O(1) verse index lookups instead of O(n) findIndex operations.
 * This eliminates the 2+ second delay when navigating to verses.
 */

import { getVerseKeys } from '@/lib/verseKeysLoader';

// Global verse index map cache
let verseIndexMap: Map<string, number> | null = null;

/**
 * Get or create the verse index map for instant lookups
 */
export function getVerseIndexMap(): Map<string, number> {
  if (!verseIndexMap) {
    console.log('🗺️ Creating verse index map for fast lookups...');
    const verseKeys = getVerseKeys();
    verseIndexMap = new Map();
    
    verseKeys.forEach((key, index) => {
      verseIndexMap!.set(key, index);
    });
    
    console.log(`🗺️ Created verse index map with ${verseIndexMap.size} entries for instant navigation`);
  }
  
  return verseIndexMap;
}

/**
 * Fast verse index lookup - O(1) instead of O(n)
 */
export function getVerseIndex(verseRef: string): number {
  const indexMap = getVerseIndexMap();
  
  // Normalize reference format - handle both "John 1:1" and "John.1:1"
  const normalizedRef = verseRef.includes(' ') ? verseRef.replace(/\s/g, '.') : verseRef;
  
  const index = indexMap.get(normalizedRef);
  return index !== undefined ? index : -1;
}

/**
 * Clear the cache when verse keys change (chronological vs canonical)
 */
export function clearVerseIndexCache(): void {
  verseIndexMap = null;
  console.log('🗺️ Cleared verse index cache');
}