/**
 * Batched verse loader wrapper
 * Integrates with existing Supabase loaders and cache system
 * FIX #2: Uses chunked loading for large batches to prevent jank
 */

import { verseCache } from './verseCache';
import { logger } from '@/lib/logger';
import { loadVersesByIndexChunked } from './chunkedLoader';

/**
 * Load verse text by indices using chunked loading for mobile performance
 */
async function loadVersesByIndex(
  indices: number[], 
  translationCode: string,
  opts?: { signal?: AbortSignal }
): Promise<Array<[number, string]>> {
  // Use chunked loader to prevent main thread jank on mobile
  return loadVersesByIndexChunked(indices, translationCode, opts);
}

/**
 * Ensure range is loaded into cache with deduplication and in-flight tracking
 * MEMORY OPTIMIZATION: Now supports translation-keyed cache
 */
export async function ensureRangeLoaded(
  a: number, 
  b: number, 
  translationCode: string,
  signal?: AbortSignal
) {
  const todo: number[] = [];
  
  // Check what needs loading (using translation-keyed cache)
  for (let i = a; i <= b; i++) {
    const e = verseCache.get(translationCode, i);
    if (e?.status === 'ready') continue;
    if (verseCache.isInFlight(translationCode, i)) continue;
    
    verseCache.markInFlight(translationCode, i);
    verseCache.set(translationCode, i, { status: 'loading', ts: performance.now() });
    todo.push(i);
  }
  
  if (!todo.length) return;

  try {
    const pairs = await loadVersesByIndex(todo, translationCode, { signal });
    
    for (const [idx, text] of pairs) {
      verseCache.set(translationCode, idx, { 
        status: 'ready', 
        text, 
        ts: performance.now() 
      });
    }
    
    logger.info('PREFETCH', 'batch:done', { 
      count: pairs.length, 
      range: `${a}-${b}`,
      translation: translationCode
    });
  } catch (e) {
    if ((e as any)?.name !== 'AbortError') {
      logger.warn('PREFETCH', 'batch:error', { 
        range: `${a}-${b}`,
        error: (e as Error).message
      });
    }
    
    // Mark as error (allow retry)
    for (const idx of todo) {
      verseCache.set(translationCode, idx, { status: 'error', ts: performance.now() });
    }
  } finally {
    // Clear in-flight flags
    for (const idx of todo) {
      verseCache.clearInFlight(translationCode, idx);
    }
  }
}
