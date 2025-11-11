/**
 * Highlights V2 API - Local-First Operations
 * 
 * Drop-in replacements for V1 highlight API functions
 * Provides instant optimistic updates with reliable background sync
 */

import {
  addRangeOptimistic,
  setWashOptimistic,
  deleteRangeOptimistic,
  deleteWashOptimistic,
  deleteAllOptimistic,
  deleteAllInTranslationOptimistic,
  getRanges,
  getWash,
  setRanges,
  isHighlightsV2Enabled,
  tombstones,
} from '@/stores/highlightsStore';

// Re-export V1 functions for compatibility when V2 is disabled
import {
  addHighlight as addHighlightV1,
  eraseHighlightPortion as eraseHighlightPortionV1,
  deleteVerseHighlight as deleteVerseHighlightV1,
  deleteAllForVerse as deleteAllForVerseV1,
} from '@/lib/userDataApi';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

// ============================================================================
// V2 OPTIMISTIC API FUNCTIONS
// ============================================================================

/**
 * Add text selection highlight with instant optimistic update
 * Replaces V1 addHighlight function
 */
export async function addHighlight(
  userId: string,
  verseRef: string,
  startOffset: number,
  endOffset: number,
  colorHex: string,
  translation: string = 'NKJV',
  note?: string,
  opacity: number = 1
): Promise<{ id: string }> {
  // Route to V1 if V2 disabled
  if (!isHighlightsV2Enabled()) {
    if (!userId) throw new Error('Not signed in');
    await addHighlightV1(userId, verseRef, startOffset, endOffset, colorHex, translation, note, opacity);
    return { id: 'v1-placeholder' }; // V1 doesn't return useful ID
  }

  // V2: Instant optimistic update
  const tempId = addRangeOptimistic(
    translation,
    verseRef,
    startOffset,
    endOffset,
    colorHex,
    note,
    opacity
  );

  return { id: tempId };
}

/**
 * Add verse-level highlight (wash) with instant optimistic update
 * New V2 function for whole-verse highlighting
 */
export function addVerseHighlight(
  verseRef: string,
  colorHex: string,
  note?: string,
  opacity: number = 0.2
): { id: string } {
  // V2 only function - return early if disabled
  if (!isHighlightsV2Enabled()) {
    throw new Error('Verse highlighting requires V2 enabled');
  }

  const tempId = setWashOptimistic(verseRef, colorHex, note, opacity);
  return { id: tempId };
}

/**
 * Delete individual text selection highlight with instant optimistic update
 * Replaces V1 deleteHighlight function
 */
export async function deleteHighlight(
  userId: string,
  rangeId: string,
  verseRef: string,
  translation: string = 'NKJV'
): Promise<void> {
  // Route to V1 if V2 disabled
  if (!isHighlightsV2Enabled()) {
    // V1: Use direct table deletion (restore original V1 functionality)
    if (!userId) throw new Error('Not signed in');
    
    const { error } = await supabase()
      .from('highlights')
      .delete()
      .eq('id', rangeId)
      .eq('user_id', userId);
      
    if (error) throw error;
    return;
  }

  // V2: Instant optimistic deletion
  deleteRangeOptimistic(rangeId, translation, verseRef);
}

/**
 * Delete verse-level highlight with instant optimistic update
 * New V2 function for verse highlighting deletion
 */
export async function deleteVerseHighlight(userId: string, verseRef: string): Promise<void> {
  // Route to V1 if V2 disabled
  if (!isHighlightsV2Enabled()) {
    if (!userId) throw new Error('Not signed in');
    return deleteVerseHighlightV1(userId, verseRef);
  }

  // V2: Instant optimistic deletion
  deleteWashOptimistic(verseRef);
}

/**
 * Delete all highlights for a specific translation with instant optimistic update
 * New V2 function for translation-specific deletion
 */
export async function deleteAllInTranslation(userId: string, verseRef: string, translation: string): Promise<void> {
  // Route to V1 if V2 disabled
  if (!isHighlightsV2Enabled()) {
    // V1: Use existing deleteAllForVerse function (approximation)
    if (!userId) throw new Error('Not signed in');
    return deleteAllForVerseV1(userId, verseRef);
  }

  // V2: Instant optimistic deletion for specific translation
  deleteAllInTranslationOptimistic(verseRef, translation);
}

/**
 * Delete all highlights for a verse with instant optimistic update
 * Replaces V1 deleteForVerse function - deletes ALL translations + wash
 */
export async function deleteForVerse(userId: string, verseRef: string): Promise<void> {
  // Route to V1 if V2 disabled
  if (!isHighlightsV2Enabled()) {
    // V1: Use existing deleteAllForVerse function
    if (!userId) throw new Error('Not signed in');
    return deleteAllForVerseV1(userId, verseRef);
  }

  // V2: Instant optimistic deletion of all highlights (all translations + wash)
  deleteAllOptimistic(verseRef);
}

/**
 * Erase portion of a highlight (trim/split operation)
 * Replaces V1 eraseHighlightPortion function
 */
export async function eraseHighlightPortion(
  verseRef: string,
  startOffset: number,
  endOffset: number,
  translation: string = 'NKJV'
): Promise<void> {
  // Route to V1 if V2 disabled
  if (!isHighlightsV2Enabled()) {
    return eraseHighlightPortionV1(verseRef, startOffset, endOffset, translation);
  }

  // V2: Optimistic local update first, then RPC with validation
  const currentRanges = getRanges(translation, verseRef);
  const { trimmedRanges, hasChanges } = trimRangesOptimistic(currentRanges, startOffset, endOffset);
  
  if (!hasChanges) {
    throw new Error('Erase operation did not affect any highlights - no highlights found in selection');
  }
  
  // Apply immediately to local store
  setRanges(translation, verseRef, trimmedRanges);
  
  logger.debug('HIGHLIGHTS', 'apply-local', { 
    op: 'erase', 
    verse_key: verseRef, 
    tr: translation, 
    count: currentRanges.length - trimmedRanges.length 
  });
  
  // Then fire RPC in background with validation
  return eraseHighlightPortionV1(verseRef, startOffset, endOffset, translation);
}

/**
 * Optimistically trim/split ranges by removing a selection
 * Returns new ranges with the selection removed
 */
function trimRangesOptimistic(
  ranges: any[], 
  startOffset: number, 
  endOffset: number
): { trimmedRanges: any[], hasChanges: boolean } {
  const trimmedRanges: any[] = [];
  let hasChanges = false;
  
  for (const range of ranges) {
    const { start_offset: rangeStart, end_offset: rangeEnd } = range;
    
    // No overlap - keep range as-is
    if (endOffset <= rangeStart || startOffset >= rangeEnd) {
      trimmedRanges.push(range);
      continue;
    }
    
    // Complete overlap - remove range entirely
    if (startOffset <= rangeStart && endOffset >= rangeEnd) {
      hasChanges = true;
      continue; // Skip this range
    }
    
    // Partial overlap - trim or split
    if (startOffset > rangeStart && endOffset < rangeEnd) {
      hasChanges = true;
      // Split into two ranges
      trimmedRanges.push({
        ...range,
        end_offset: startOffset,
        id: `${range.id}_left`
      });
      trimmedRanges.push({
        ...range,
        start_offset: endOffset,
        id: `${range.id}_right`
      });
    } else if (startOffset <= rangeStart && endOffset < rangeEnd) {
      // Trim from left
      hasChanges = true;
      trimmedRanges.push({
        ...range,
        start_offset: endOffset
      });
    } else if (startOffset > rangeStart && endOffset >= rangeEnd) {
      // Trim from right
      hasChanges = true;
      trimmedRanges.push({
        ...range,
        end_offset: startOffset
      });
    }
  }
  
  return { trimmedRanges, hasChanges };
}

// ============================================================================
// V2 READ FUNCTIONS (Memory-First)
// ============================================================================

/**
 * Get all text selection highlights for a verse (instant from memory)
 * Replaces V1 network-based queries
 */
export function getVerseHighlights(verseRef: string, translation: string = 'NKJV') {
  if (!isHighlightsV2Enabled()) {
    // V1: Use existing network-based hooks
    return null; // Let caller use useVerseHighlights hook
  }

  // V2: Instant memory lookup
  const ranges = getRanges(translation, verseRef);
  return ranges.map(range => ({
    id: range.id,
    verse_key: range.verse_key,
    translation: range.translation,
    start_offset: range.start_offset,
    end_offset: range.end_offset,
    color_hex: range.color_hex,
    note: range.note,
    opacity: range.opacity,
    updated_at: range.updated_at,
  }));
}

/**
 * Get verse-level highlight (wash) for a verse (instant from memory)
 * New V2 function for verse highlighting
 */
export function getVerseWash(verseRef: string) {
  if (!isHighlightsV2Enabled()) {
    return null;
  }

  // V2: Instant memory lookup
  const wash = getWash(verseRef);
  if (!wash) return null;

  return {
    id: wash.id,
    verse_key: wash.verse_key,
    color_hex: wash.color_hex,
    note: wash.note,
    opacity: wash.opacity,
    updated_at: wash.updated_at,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a verse has any highlights (instant from memory)
 */
export function hasHighlights(verseRef: string, translation: string = 'NKJV'): boolean {
  if (!isHighlightsV2Enabled()) {
    return false; // Caller should use network-based check
  }

  const ranges = getRanges(translation, verseRef);
  const wash = getWash(verseRef);
  
  return ranges.length > 0 || wash !== null;
}

/**
 * Get highlight statistics for debugging
 */
export function getHighlightStats() {
  if (!isHighlightsV2Enabled()) {
    return null;
  }

  // Import stats function dynamically to avoid circular imports
  const { getStats } = require('@/stores/highlightsStore');
  return getStats();
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Helper function to convert V1 color format to V2 if needed
 */
function normalizeColor(color: string): string {
  // Handle different color formats (HSL -> hex, etc.)
  if (color.startsWith('hsl(')) {
    // Convert HSL to hex if needed
    // For now, return as-is and let server handle conversion
    return color;
  }
  
  if (!color.startsWith('#')) {
    return `#${color}`;
  }
  
  return color;
}