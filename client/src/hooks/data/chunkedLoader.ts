/**
 * OPTIMIZED: Chunk large batch loads to prevent main thread jank
 * Loads verses in chunks with RAF yields to keep UI responsive
 */

const MAX_BATCH_SIZE = 500; // Large enough for 400-verse desktop batches, 300-verse mobile

export async function loadVersesByIndexChunked(
  indices: number[],
  translationCode: string,
  opts?: { signal?: AbortSignal }
): Promise<Array<[number, string]>> {
  if (opts?.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // Import dependencies
  const { getVerseKeys } = await import('@/lib/verseKeysLoader');
  const { masterCache } = await import('@/lib/supabaseClient');
  const { loadTranslationOnce } = await import('@/lib/translationLoader');
  
  const allVerseKeys = getVerseKeys();
  
  // Ensure translation is loaded
  let translationMap = masterCache.get(`translation-${translationCode}`);
  if (!translationMap) {
    translationMap = await loadTranslationOnce(translationCode);
  }

  const result: Array<[number, string]> = [];

  // Process in chunks to avoid long tasks on mobile
  for (let i = 0; i < indices.length; i += MAX_BATCH_SIZE) {
    // Check abort before each chunk
    if (opts?.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const slice = indices.slice(i, i + MAX_BATCH_SIZE);
    
    // Build chunk results
    for (const idx of slice) {
      const verseKey = allVerseKeys[idx];
      const text = translationMap?.get(verseKey) || '';
      result.push([idx, text]);
    }

    // Yield to UI thread after each chunk (prevents jank)
    if (i + MAX_BATCH_SIZE < indices.length) {
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
  }

  return result;
}
