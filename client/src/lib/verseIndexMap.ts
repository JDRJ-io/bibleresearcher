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
    const verseKeys = getVerseKeys();
    verseIndexMap = new Map();
    
    verseKeys.forEach((key, index) => {
      verseIndexMap!.set(key, index);
    });
    
  }
  
  return verseIndexMap;
}

/**
 * Normalize verse reference to standard "Book.Chapter:Verse" format
 * Handles variants like "Gen 1:1", "Gen.1.1", "Gen.1:1"
 */
export function normalizeVerseRef(verseRef: string): string {
  // Handle "John 1:1" → "John.1:1"
  let normalized = verseRef.includes(' ') ? verseRef.replace(/\s/g, '.') : verseRef;
  
  // Handle "Gen.1.1" → "Gen.1:1" (dot before verse → colon before verse)
  normalized = normalized.replace(/^([^.]+\.\d+)\.(\d+)$/, '$1:$2');
  
  return normalized;
}

/**
 * Fast verse index lookup - O(1) instead of O(n)
 */
export function getVerseIndex(verseRef: string): number {
  const indexMap = getVerseIndexMap();
  
  // Normalize reference format - handle "John 1:1", "John.1:1", and "John.1.1"
  const normalizedRef = normalizeVerseRef(verseRef);
  
  const index = indexMap.get(normalizedRef);
  return index !== undefined ? index : -1;
}

/**
 * Clear the cache when verse keys change (chronological vs canonical)
 */
export function clearVerseIndexCache(): void {
  verseIndexMap = null;
}