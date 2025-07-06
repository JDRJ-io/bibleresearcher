/**
 * Anchor-Centered Loading System
 * 
 * This replaces all edge-based loading with a center-anchored approach.
 * The system tracks anchorIndex (verse at viewport center) and loads
 * chunks around that anchor position.
 * 
 * Ground Rules:
 * 1. verseKeys-canonical.json is the ONLY row timeline
 * 2. loadChunk never asks for data outside its slice
 * 3. All lazy fetches key off verse IDs inside the slice
 * 4. Edge-loading logic is completely eliminated
 */

import { getVerseKeys, getVerseCount } from '@/lib/verseKeysLoader';
import type { BibleVerse } from '@/types/bible';

// Anchor-centered loading constants
const DEFAULT_BUFFER = 100; // ±100 verses around center = 200 total verses loaded
const RENDER_BUFFER = 20;   // Additional buffer for smooth scrolling

/**
 * Load a chunk of verses around the anchor index
 * This is the ONLY way verses should be loaded - never at edges
 */
export function loadChunk(anchorIndex: number, buffer: number = DEFAULT_BUFFER): {
  start: number;
  end: number;
  verseKeys: string[];
  slice: string[];
} {
  const allVerseKeys = getVerseKeys();
  const totalRows = allVerseKeys.length;

  // Calculate center-anchored range
  const start = Math.max(0, anchorIndex - buffer);
  const end = Math.min(totalRows - 1, anchorIndex + buffer);

  // Extract the slice from the master verse keys timeline
  const slice = allVerseKeys.slice(start, end + 1);

  console.log(`📍 ANCHOR LOAD: Center=${anchorIndex} (${allVerseKeys[anchorIndex]}), Range=${start}-${end}, Slice=${slice.length} verses`);

  return {
    start,
    end,
    verseKeys: allVerseKeys,
    slice
  };
}

/**
 * Calculate anchor index from scroll position
 * This determines which verse is at the viewport center
 */
export function calculateAnchorIndex(
  scrollTop: number,
  rowHeight: number,
  totalRows: number = getVerseCount()
): number {
  const anchorIndex = Math.floor(scrollTop / rowHeight);
  return Math.max(0, Math.min(totalRows - 1, anchorIndex));
}

/**
 * Calculate rendering range for virtual scrolling
 * This determines which verses are actually rendered in DOM
 */
export function calculateRenderRange(
  anchorIndex: number,
  viewportHeight: number,
  rowHeight: number,
  buffer: number = RENDER_BUFFER
): { start: number; end: number } {
  const visibleRows = Math.ceil(viewportHeight / rowHeight);
  const halfVisible = Math.ceil(visibleRows / 2);

  const start = Math.max(0, anchorIndex - halfVisible - buffer);
  const end = Math.min(getVerseCount() - 1, anchorIndex + halfVisible + buffer);

  return { start, end };
}

/**
 * Key-off loading: Load data for specific verse IDs only
 * This prevents loading data outside the current slice
 */
export function keyOffLoad<T>(
  verseIds: string[],
  loadFunction: (verseId: string) => T | undefined,
  description: string = "data"
): Map<string, T> {
  const results = new Map<string, T>();
  
  console.log(`🔑 KEY-OFF LOAD: Loading ${description} for ${verseIds.length} verses in slice`);
  
  verseIds.forEach(verseId => {
    const data = loadFunction(verseId);
    if (data !== undefined) {
      results.set(verseId, data);
    }
  });

  console.log(`✓ Loaded ${description} for ${results.size}/${verseIds.length} verses`);
  return results;
}

/**
 * Apply loaded data to verse objects in place
 * This mutates verse objects directly instead of creating new arrays
 */
export function applyDataToVerses(
  verses: BibleVerse[],
  dataMap: Map<string, any>,
  applyFunction: (verse: BibleVerse, data: any) => void
): void {
  let appliedCount = 0;
  
  verses.forEach(verse => {
    const verseKey = `${verse.book}.${verse.chapter}:${verse.verse}`;
    const data = dataMap.get(verseKey);
    if (data) {
      applyFunction(verse, data);
      appliedCount++;
    }
  });
  
  console.log(`✓ Applied data to ${appliedCount}/${verses.length} verses in slice`);
}

/**
 * Scroll anchor preservation
 * Maintains anchor position during UI changes
 */
export function preserveAnchor(
  anchorIndex: number,
  rowHeight: number,
  callback: () => void
): void {
  const savedScrollTop = anchorIndex * rowHeight;
  
  // Execute the callback that might change UI
  callback();
  
  // Restore anchor position on next frame
  requestAnimationFrame(() => {
    const scrollElement = document.querySelector('[data-virtual-scroller]');
    if (scrollElement) {
      scrollElement.scrollTop = savedScrollTop;
    }
  });
}

export interface AnchorState {
  anchorIndex: number;
  loadedRange: { start: number; end: number };
  renderRange: { start: number; end: number };
  lastAnchorChange: number;
}

/**
 * Track anchor state changes
 * Prevents unnecessary reloads when anchor hasn't changed significantly
 */
export function shouldUpdateAnchor(
  currentAnchor: number,
  lastAnchor: number,
  threshold: number = 10
): boolean {
  return Math.abs(currentAnchor - lastAnchor) >= threshold;
}