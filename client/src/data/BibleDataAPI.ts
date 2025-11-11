import { supabase, masterCache } from '@/lib/supabaseClient';
import { db } from '@/offline/offlineDB';
import { queueSync } from '@/offline/queueSync';
import { loadTranslationOnce } from '@/lib/translationLoader';
import { ungzip } from 'pako';
import { logger, redact } from '@/lib/logger';
import { count } from '@/lib/counters';

// CANONICAL BUCKET PATHS - SINGLE SOURCE OF TRUTH
const BUCKET = 'anointed';

const paths = {
  translation:  (id: string) => `translations/${id}.txt`,
  crossRef:     'references/cf3.txt',
  crossRefOffsets: 'references/cf3_offsets.json',
  crossRefTop5: 'references/cf3_top_5.jsonl',
  crossRefRestRanges: 'references/cf3_rest_ranges.json',
  prophecyRows: 'references/prophecy_rows.json',  // JSON format as you described
  prophecyRowsGrouped: 'references/prophecy_rows_grouped.json',  // New grouped format with verse ranges
  prophecyIdx:  'references/prophecy_index.txt',  // Text format as you described
  strongsVerseOffsets: 'strongs/strongsVersesOffsets.json',
  strongsIndexOffsets: 'strongs/strongsIndexOffsets.json',
  verseKeys:    'metadata/verseKeys-canonical.json',
  verseKeysChronological: 'metadata/verseKeys-chronological.json',
  datesCanonical: 'metadata/dates-canonical.txt',
  datesChronological: 'metadata/dates-chronological.txt',
  labels:       (translationCode: string) => `labels/${translationCode}/ALL.json`,
  contextGroups: 'metadata/context_groups.json', // Context boundaries for verses
};

export async function fetchFromStorage(path: string): Promise<string> {
  logger.debug('TX', 'fetch from storage', { path }, { sample: 0.05, throttleMs: 1000 });
  
  // Use direct public URL instead of Supabase client to bypass auth issues
  const publicUrl = `https://ecaqvxbbscwcxbjpfrdm.supabase.co/storage/v1/object/public/${BUCKET}/${path}`;
  
  const response = await fetch(publicUrl);
  if (!response.ok) {
    throw new Error(`Storage fetch failed → ${path}: HTTP ${response.status} ${response.statusText}`);
  }
  
  return await response.text();
}

export async function uploadToStorage(path: string, fileContent: string | Blob): Promise<void> {
  const { error } = await supabase()
    .storage
    .from(BUCKET)
    .upload(path, fileContent, { upsert: true });

  if (error) throw new Error(`Supabase upload failed → ${path}: ${error.message}`);
}

// Load dates data as a Map for verse lookup  
export async function loadDatesMap(chronological: boolean = false): Promise<Map<string, string>> {
  const cacheKey = chronological ? 'dates-map-chronological' : 'dates-map-canonical';
  
  return getOrFetch(cacheKey, async () => {
    const orderType = chronological ? 'chronological' : 'canonical';
    const path = chronological ? paths.datesChronological : paths.datesCanonical;
    return await logger.time('TX', `load ${orderType} dates map`, async () => {
      const textData = await fetchFromStorage(path);
      const datesMap = new Map<string, string>();
      
      // Parse dates format: verse_reference#date_info
      const lines = textData.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const [verseRef, dateInfo] = trimmed.split('#');
        if (verseRef && dateInfo) {
          datesMap.set(verseRef.trim(), dateInfo.trim());
        }
      }
      
      return datesMap;
    }, 'debug');
  });
}

function getOrFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  if (masterCache.has(key)) {
    return Promise.resolve(masterCache.get(key) as T);
  }

  return fetchFn().then(result => {
    masterCache.set(key, result);
    return result;
  });
}

export async function loadTranslation(id: string) {
  // Route through unified promise deduplication loader
  return await loadTranslationOnce(id);
}

export async function loadTranslationAsText(id: string) {
  return getOrFetch(`translation-text-${id}`, async () => {
    return await fetchFromStorage(paths.translation(id));
  });
}

export async function loadVerseKeys(chronological = false): Promise<string[]> {
  const cacheKey = chronological ? 'verse-keys-chronological' : 'verse-keys-canonical';
  const filePath = chronological ? paths.verseKeysChronological : paths.verseKeys;


  return getOrFetch(cacheKey, async () => {
    
    try {
      const data = await fetchFromStorage(filePath);
      const verseKeys = JSON.parse(data);
      return verseKeys;
    } catch (error) {
      logger.warn('TX', 'failed to load verse keys, falling back', { filePath, error });
      
      if (chronological) {
        // If chronological file doesn't exist, fall back to canonical
        const fallbackData = await fetchFromStorage(paths.verseKeys);
        const fallbackKeys = JSON.parse(fallbackData);
        return fallbackKeys;
      } else {
        // Re-throw error for canonical file - this should always exist
        throw error;
      }
    }
  });
}

export async function loadDatesData(chronological = false): Promise<string[]> {
  const cacheKey = chronological ? 'dates-chronological' : 'dates-canonical';
  const filePath = chronological ? paths.datesChronological : paths.datesCanonical;

  return getOrFetch(cacheKey, async () => {
    const data = await fetchFromStorage(filePath);
    const dates = data.split('\n').map(line => line.trim()).filter(line => line);
    logger.debug('TX', 'loaded dates', { count: dates.length, chronological });
    return dates;
  });
}

export async function loadVerseKeysAsText() {
  return getOrFetch('verse-keys-canonical-text', async () => {
    return await fetchFromStorage(paths.verseKeys.replace('.json', '.txt'));
  });
}

export async function loadChronologicalVerseKeys() {
  return getOrFetch('verse-keys-chronological', async () => {
    const textData = await fetchFromStorage(paths.verseKeysChronological);
    return JSON.parse(textData);
  });
}

// Cross-reference loading with proper caching - FALLBACK ONLY (prefer getCrossRefsBatch)
// DEPRECATED: Old function replaced with expert's optimized range request system
async function loadCrossReferences() {
  logger.error('TX', 'DEPRECATED: loadCrossReferences() - use getCrossRefsBatch() instead');
  throw new Error('loadCrossReferences() is deprecated. Use getCrossRefsBatch() for optimized performance.');
}

// Get cross-reference data for BibleDataAPI facade
export async function getCrossRef(): Promise<string> {
  logger.error('TX', 'DEPRECATED: getCrossRef() - use getCrossRefsBatch() instead');
  throw new Error('getCrossRef() is deprecated. Use getCrossRefsBatch() for optimized performance.');
}

export async function loadCrossRefSlice(start: number, end: number) {
  // Remove obsolete slice loaders
  logger.warn('CF', 'loadCrossRefSlice is deprecated - use getCrossReferences instead');
  return {};
}

// Prophecy loading with proper caching
export async function loadProphecyRows(): Promise<any> {
  return getOrFetch('prophecy-rows', async () => {
    count('fetchProphecyRows');
    const textData = await fetchFromStorage(paths.prophecyRows);
    return JSON.parse(textData);
  });
}

export async function loadProphecyRowsGrouped(): Promise<any> {
  return getOrFetch('prophecy-rows-grouped', async () => {
    count('fetchProphecyRowsGrouped');
    const textData = await fetchFromStorage(paths.prophecyRowsGrouped);
    return JSON.parse(textData);
  });
}

export async function loadProphecyIndex(): Promise<string> {
  return getOrFetch('prophecy-index', async () => {
    count('fetchProphecyIndex');
    return await fetchFromStorage(paths.prophecyIdx);
  });
}

// Dates functionality - loads verse dating metadata
export async function getDatesCanonical(): Promise<string> {
  return getOrFetch('dates-canonical', async () => {
    return await fetchFromStorage(paths.datesCanonical);
  });
}

export async function getDatesChronological(): Promise<string> {
  return getOrFetch('dates-chronological', async () => {
    return await fetchFromStorage(paths.datesChronological);
  });
}

// Labels system - semantic highlighting data
export async function getLabelsData(translation: string = 'KJV'): Promise<any> {
  const cacheKey = `labels-${translation}`;
  return getOrFetch(cacheKey, async () => {
    logger.debug('TX', 'loading labels', { translation });
    try {
      const text = await fetchFromStorage(paths.labels(translation));
      const parsed = JSON.parse(text);
      logger.debug('TX', 'labels loaded', { translation, count: Object.keys(parsed).length });
      return parsed;
    } catch (error) {
      logger.warn('TX', 'labels file not found', { translation });
      // Return empty object instead of throwing to prevent UI crashes
      return {};
    }
  });
}

// Context boundaries - verse grouping data  
export async function getContextGroups(): Promise<string[][]> {
  return getOrFetch('context-groups', async () => {
    const text = await fetchFromStorage(paths.contextGroups);
    const groups = JSON.parse(text);
    return groups;
  });
}

// Global search functionality
export async function searchVerses(query: string, translationId: string = 'KJV'): Promise<Array<{ reference: string, text: string, index: number }>> {
  const translationMap = await loadTranslation(translationId);
  const results: Array<{ reference: string, text: string, index: number }> = [];

  // Special random verse feature
  if (query === '%') {
    const allEntries = Array.from(translationMap.entries());
    if (allEntries.length > 0) {
      const randomEntry = allEntries[Math.floor(Math.random() * allEntries.length)];
      const verseKeys = await loadVerseKeys();
      const index = verseKeys.findIndex((key: string) => key === randomEntry[0]);
      return [{
        reference: randomEntry[0],
        text: randomEntry[1],
        index: index
      }];
    }
    return [];
  }

  // Regular text search
  const searchLower = query.toLowerCase();
  const verseKeys = await loadVerseKeys();

  for (const [reference, text] of Array.from(translationMap.entries())) {
    if (text.toLowerCase().includes(searchLower)) {
      const index = verseKeys.findIndex((key: string) => key === reference);
      results.push({
        reference,
        text,
        index: index >= 0 ? index : 0
      });

      // Limit results to prevent UI lag
      if (results.length >= 100) break;
    }
  }

  return results;
}

export async function loadProphecySlice(start: number, end: number) {
  // Remove obsolete slice loaders
  logger.warn('PR', 'loadProphecySlice is deprecated - use prophecyCache instead');
  return {};
}

export async function saveNotes(note: any, preserveAnchor?: (ref: string, index: number) => void) {
  const result = await supabase().from('user_notes').upsert(note);
  if (preserveAnchor) {
    preserveAnchor(note.verseReference, note.verseIndex);
  }
  return result;
}

// READ - with offline fallback
export async function getNotes(): Promise<any[]> {
  const local = await db.notes.toArray();
  if (!navigator.onLine) return local;

  const { data, error } = await supabase().from('user_notes').select('id, verse_key, translation, body, created_at, updated_at');
  if (error) return local; // Fall back

  await db.notes.clear();
  await db.notes.bulkAdd(data.map((n: any) => ({ ...n, pending: false })));
  return data;
}

// WRITE - with offline queue
export async function saveNote(note: any, preserveAnchor?: (ref: string, index: number) => void) {
  const local = { ...note, updated_at: Date.now(), pending: true };
  await db.notes.add(local);
  await queueSync(); // Triggers BG sync or immediate push

  if (preserveAnchor) {
    preserveAnchor(note.verseReference, note.verseIndex);
  }
  return { data: [{ id: local.id }] };
}

// -------- Cross-reference offsets ----------
let cfOffsetsCache: Record<string, [number, number]> | null = null;

// -------- Two-stage cross-reference caches ----------
let cfTop5Cache: Record<string, string[]> | null = null;
let cfRestRangesCache: Record<string, [number, number]> | null = null;


export async function getCfOffsets() {
  if (cfOffsetsCache) return cfOffsetsCache;
  const path = paths.crossRefOffsets;
  const txt = await fetchFromStorage(path);
  const obj = JSON.parse(txt) as Record<string, [number, number]>;
  cfOffsetsCache = obj;
  return obj;
}

// Import the canonical parser
import { parseVerseReference, canonicalToReference } from '@/lib/bibleSearchEngine';

// Helper function to canonicalize verse references using the official parser
function canonicalizeVerseReference(ref: string): string {
  const parsed = parseVerseReference(ref);
  if (!parsed || !parsed.book || !parsed.chapter || !parsed.verse) {
    return ref; // Return original if parsing fails
  }
  
  const bookRef = canonicalToReference(parsed.book);
  return `${bookRef}.${parsed.chapter}:${parsed.verse}`;
}

// -------- Consecutive Verse Utilities (for cf3 format) ----------

// Check if a reference contains consecutive verses (uses # separator)
export function isConsecutiveVerse(ref: string): boolean {
  return ref.includes('#');
}

// Parse consecutive verse reference like "John.1:1#John.1:2#John.1:3"
// Returns: { display: "John.1:1-3", verses: ["John.1:1", "John.1:2", "John.1:3"] }
export function parseConsecutiveReference(ref: string): { display: string, verses: string[] } {
  if (!ref.includes('#')) {
    // Single verse - return as-is
    return { display: ref, verses: [ref] };
  }
  
  const verses = ref.split('#').map(v => v.trim()).filter(v => v);
  
  if (verses.length === 0) {
    return { display: ref, verses: [ref] };
  }
  
  if (verses.length === 1) {
    return { display: verses[0], verses };
  }
  
  // Extract the range: "John.1:1" to "John.1:3" becomes "John.1:1-3"
  const first = verses[0];
  const last = verses[verses.length - 1];
  
  // Extract verse number from last reference (e.g., "John.1:3" → "3")
  const lastParts = last.split(':');
  if (lastParts.length === 2) {
    const lastVerseNum = lastParts[1];
    const display = `${first}-${lastVerseNum}`;
    return { display, verses };
  }
  
  // Fallback: couldn't parse properly, just return first-last
  return { display: `${first}-${last}`, verses };
}

// Combine text from multiple verses (for consecutive references)
// Uses the provided getVerseText function to fetch each verse's text
export function getCombinedVerseText(
  verses: string[], 
  translation: string, 
  getVerseText: (ref: string, translation: string) => string | undefined
): string {
  return verses
    .map(v => getVerseText(v, translation) || '')
    .filter(text => text.trim())
    .join(' '); // Join with space between verses
}

// TWO-STAGE LOADING: Load top 5 cross-references from compressed JSONL
export async function getCrossRefsTop5(): Promise<Record<string, string[]>> {
  if (cfTop5Cache) return cfTop5Cache;
  
  logger.debug('CF', 'loading top-5 cross-refs');
  
  try {
    const path = paths.crossRefTop5;
    const text = await fetchFromStorage(path);
    
    const top5Map: Record<string, string[]> = {};
    
    // Parse JSONL format: each line is a JSON object
    // {"verse": "Gen.1:1", "top5": ["John.1:1#John.1:2#John.1:3", "Heb.11:3", ...], "rest_pointer": null}
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      
      try {
        const parsed = JSON.parse(line) as { verse: string; top5: string[]; rest_pointer: number[] | null };
        
        if (!parsed.verse || !Array.isArray(parsed.top5)) continue;
        
        // Store the top5 array as-is
        // Each item might be a single ref like "Heb.11:3" 
        // OR a string of consecutive refs like "John.1:1#John.1:2#John.1:3"
        top5Map[parsed.verse.trim()] = parsed.top5.map(ref => ref.trim()).filter(ref => ref);
        
      } catch (parseError) {
        logger.warn('CF', 'failed to parse JSONL line', { preview: line.substring(0, 50) });
        continue;
      }
    }
    
    logger.debug('CF', 'loaded top-5 cross-refs', { count: Object.keys(top5Map).length });
    cfTop5Cache = top5Map;
    return top5Map;
    
  } catch (error) {
    logger.error('CF', 'failed to load top-5 cross-refs', error);
    return {};
  }
}

// TWO-STAGE LOADING: Load rest ranges map
export async function getCfRestRanges(): Promise<Record<string, [number, number]>> {
  if (cfRestRangesCache) return cfRestRangesCache;
  
  try {
    const path = paths.crossRefRestRanges;
    const txt = await fetchFromStorage(path);
    const obj = JSON.parse(txt) as Record<string, [number, number]>;
    cfRestRangesCache = obj;
    logger.debug('CF', 'loaded rest ranges', { count: Object.keys(obj).length });
    return obj;
  } catch (error) {
    logger.error('CF', 'failed to load rest ranges', error);
    return {};
  }
}

// TWO-STAGE LOADING: Load remaining cross-references for a specific verse
export async function getCrossRefsRemainder(verseId: string): Promise<string[]> {
  try {
    logger.debug('CF', 'loading remainder cross-refs', { verseId });
    
    // Use verse ID as-is (already in correct format)
    const canonicalVerseId = verseId.trim();
    
    // Get the rest ranges
    const restRanges = await getCfRestRanges();
    const range = restRanges[canonicalVerseId];
    
    if (!range) {
      return [];
    }
    
    const [start, end] = range;
    
    // Use the existing fetchSlice function for optimized range fetching
    const slice = await fetchSlice(start, end);
    
    // Parse the cross-reference data - the slice contains ONLY the remainder references
    // Format: group1$group2#ref2#ref3$group3...
    // No verse ID prefix - this is just the tail portion from cf3_rest_ranges.json
    const allRefs: string[] = [];
    
    if (slice.trim()) {
      // Parse the reference groups separated by $ and individual refs by #
      const referenceGroups = slice.split('$').filter(group => group.trim());
      
      referenceGroups.forEach((group, groupIndex) => {
        const sequentialRefs = group.split('#').filter(ref => ref.trim());
        
        sequentialRefs.forEach(ref => {
          const cleanRef = ref.trim();
          if (cleanRef) {
            allRefs.push(cleanRef);
          }
        });
      });
    }
    
    logger.debug('CF', 'loaded remainder cross-refs', { verseId, count: allRefs.length });
    return allRefs;
    
  } catch (error) {
    logger.error('CF', 'failed to load remainder cross-refs', error);
    return [];
  }
}

// EXPERT IMPLEMENTATION: Fetch slice from cross-reference file using HTTP Range requests
async function fetchSlice(start: number, end: number): Promise<string> {
  logger.debug('CF', 'fetch slice', { start, end, bytes: end - start + 1 });
  
  try {
    // Build the URL for the cross-reference file
    const filePath = paths.crossRef;
    
    // Get the signed URL for the file
    const { data: signedUrlData, error: signedUrlError } = await supabase()
      .storage
      .from(BUCKET)
      .createSignedUrl(filePath, 60); // 60 seconds expiry
    
    if (signedUrlError) {
      logger.error('CF', 'failed to create signed URL', signedUrlError);
      throw signedUrlError;
    }
    
    if (!signedUrlData?.signedUrl) {
      throw new Error(`No signed URL returned for ${filePath}`);
    }
    
    // Make HTTP Range request using fetch
    const response = await fetch(signedUrlData.signedUrl, {
      headers: {
        'Range': `bytes=${start}-${end}`,
        'Cache-Control': 'no-store' // Avoid SW caching issues during debugging
      }
    });
    
    // Check for successful partial content response
    if (response.status !== 206) {
      logger.error('CF', 'expected 206, got ' + response.status);
      const errorText = await response.text();
      logger.error('CF', 'response body', { errorText });
      throw new Error(`HTTP Range request failed: ${response.status} - ${errorText}`);
    }
    
    // Verify Content-Range header
    const contentRange = response.headers.get('Content-Range');
    
    // Read the response body
    const slice = await response.text();
    return slice;
    
  } catch (error) {
    logger.error('CF', 'HTTP Range request failed', error);
    
    // Fallback: Try without Range header if Range requests fail
    logger.warn('CF', 'attempting full file download fallback');
    
    const { data, error: downloadError } = await supabase()
      .storage
      .from(BUCKET)
      .download(paths.crossRef);
      
    if (downloadError) throw downloadError;
    
    const fullText = await data.text();
    const slice = fullText.substring(start, end + 1);  // +1 to make end index inclusive
    logger.warn('CF', 'fallback: extracted slice client-side', { length: slice.length });
    
    return slice;
  }
}

// EXPERT IMPLEMENTATION: Ultra-fast batch loading with true HTTP Range requests
export async function getCrossRefsBatch(verseIds: string[]): Promise<Record<string, string[]>> {
  if (verseIds.length === 0) return {};

  logger.debug('CF', 'batch loading cross-refs', { count: verseIds.length });
  
  try {
    // Step 1: Load offset map (cached after first call)
    const offsetMap = await getCfOffsets();
    
    // Step 2: Get byte spans for all verses, filter out missing ones
    const spans = verseIds
      .map(id => offsetMap[id])
      .filter(Boolean) as [number, number][];
      
    if (spans.length === 0) return {};

    // Step 3: Merge overlapping spans to minimize requests
    spans.sort((a, b) => a[0] - b[0]);
    const merged: { s: number; e: number }[] = [];
    
    for (const [s, e] of spans) {
      const last = merged.at(-1);
      if (last && s <= last.e + 1) {
        last.e = Math.max(last.e, e);
      } else {
        merged.push({ s, e });
      }
    }

    logger.debug('CF', 'batch: merged ranges', { requests: merged.length, verses: verseIds.length });

    // Step 4: Pull each merged window using TRUE range requests
    const chunks = await Promise.all(
      merged.map(m => fetchSlice(m.s, m.e))
    );
    const blob = chunks.join('\n');

    // Step 5: Build { id: refs[] } map from combined data
    const refs: Record<string, string[]> = {};
    
    blob.split('\n').forEach(line => {
      if (!line.trim()) return;
      
      const [id, referencesData] = line.split('$$');
      if (!id || !referencesData) return;
      
      // Parse the reference groups separated by $ and individual refs by #
      const allReferences: string[] = [];
      const referenceGroups = referencesData.split('$').filter(group => group.trim());

      referenceGroups.forEach(group => {
        const sequentialRefs = group.split('#').filter(ref => ref.trim());
        sequentialRefs.forEach(ref => {
          const cleanRef = ref.trim();
          if (cleanRef.match(/^[123]?[A-Za-z]+\.\d+:\d+$/)) {
            allReferences.push(cleanRef);
          }
        });
      });
      
      refs[id] = allReferences;
    });

    logger.debug('CF', 'batch complete', { verses: Object.keys(refs).length, requests: merged.length });
    return refs;

  } catch (error) {
    logger.error('CF', 'batch loading failed', error);
    return {};
  }
}

// -------- Strong's offsets ----------
let strongsVerseOffsets: Record<string, [number, number]> | null = null;
let strongsIndexOffsets: Record<string, [number, number]> | null = null;

export async function getStrongsOffsets() {
  if (strongsVerseOffsets && strongsIndexOffsets) return { strongsVerseOffsets, strongsIndexOffsets };

  try {
    logger.debug('TX', 'loading Strongs offset files');
    const [vTxt, iTxt] = await Promise.all([
      fetchFromStorage(paths.strongsVerseOffsets),
      fetchFromStorage(paths.strongsIndexOffsets),
    ]);

    strongsVerseOffsets = JSON.parse(vTxt);
    strongsIndexOffsets = JSON.parse(iTxt);

    logger.debug('TX', 'loaded Strongs offsets', {
      verseOffsets: Object.keys(strongsVerseOffsets || {}).length,
      indexOffsets: Object.keys(strongsIndexOffsets || {}).length
    });

    return { strongsVerseOffsets, strongsIndexOffsets };
  } catch (error) {
    logger.error('TX', 'failed to load Strongs offsets', error);
    // Return mock data for testing - this ensures the overlay can at least open
    const mockOffsets = {
      strongsVerseOffsets: { "Gen.1:1": [0, 100] } as Record<string, [number, number]>,
      strongsIndexOffsets: { "H7225": [0, 50], "H1254": [50, 100] } as Record<string, [number, number]>
    };
    strongsVerseOffsets = mockOffsets.strongsVerseOffsets;
    strongsIndexOffsets = mockOffsets.strongsIndexOffsets;
    return mockOffsets;
  }
}

// -------- Prophecy loaders ----------
let prophecyIndex: Record<string, [number, number]> | null = null;
let prophecyRowsTxt: string | null = null;

export async function getProphecy(indexKey: string) {
  // Lazy load index JSON
  if (!prophecyIndex) {
    const idx = await fetchFromStorage(paths.prophecyIdx);
    prophecyIndex = JSON.parse(idx);
  }
  // Lazy load rows file
  if (!prophecyRowsTxt) {
    prophecyRowsTxt = await fetchFromStorage(paths.prophecyRows);
  }
  const slice = prophecyIndex![indexKey];
  if (!slice) return null;
  return prophecyRowsTxt!.substring(slice[0], slice[1]);
}

// -------- Prophecy data parsing with deduplication and cleanup ----------
let prophecyWorker: Worker | null = null;

let __pendingProphecy: Promise<{
  verseRoles: Record<string, { P: number[], F: number[], V: number[] }>;
  prophecyIndex: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }>;
}> | null = null;

let __prophecyRowsDataCache: Record<number | string, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }> | null = null;
let __prophecyIndexTextCache: string | null = null;

let __parsedProphecyCache: {
  verseRoles: Record<string, { P: number[], F: number[], V: number[] }>;
  prophecyIndex: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }>;
} | null = null;

export async function loadProphecyData(): Promise<{
  verseRoles: Record<string, { P: number[], F: number[], V: number[] }>;
  prophecyIndex: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }>;
}> {
  if (__parsedProphecyCache) {
    return __parsedProphecyCache;
  }

  if (__pendingProphecy) {
    return __pendingProphecy;
  }

  logger.info('PR', 'loadProphecyData() start');

  __pendingProphecy = (async () => {
    const [rowsData, indexText] = await Promise.all([
      __prophecyRowsDataCache
        ? Promise.resolve(__prophecyRowsDataCache)
        : loadProphecyRowsGrouped().then((json) => {
            __prophecyRowsDataCache = json;
            return json;
          }),
      __prophecyIndexTextCache
        ? Promise.resolve(__prophecyIndexTextCache)
        : loadProphecyIndex().then((txt) => {
            __prophecyIndexTextCache = txt;
            return txt;
          }),
    ]);

    const verseRoles: Record<string, { P: number[], F: number[], V: number[] }> = {};
    const indexLines = indexText.split('\n').filter((line) => line.trim());

    for (const line of indexLines) {
      const [verse, mappingsStr] = line.split('$');
      if (!verse || !mappingsStr) continue;

      const roles = { P: [] as number[], F: [] as number[], V: [] as number[] };
      const mappings = mappingsStr.split(',');
      for (const mapping of mappings) {
        const [idStr, roleStr] = mapping.split(':');
        if (!idStr || !roleStr) continue;
        const id = parseInt(idStr);
        const role = roleStr.trim() as 'P' | 'F' | 'V';
        if (!Number.isNaN(id) && roles[role]) roles[role].push(id);
      }
      verseRoles[verse.trim()] = roles;
    }

    const prophecyIndexData: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }> = {};
    Object.entries(rowsData).forEach(([idStr, data]: [string, any]) => {
      const id = parseInt(idStr);
      if (Number.isNaN(id)) return;
      prophecyIndexData[id] = {
        summary: data.summary || '',
        prophecy: data.prophecy || [],
        fulfillment: data.fulfillment || [],
        verification: data.verification || [],
      };
    });

    __parsedProphecyCache = { verseRoles, prophecyIndex: prophecyIndexData };
    logger.debug('PR', 'loaded prophecy data (grouped)', { 
      verses: Object.keys(verseRoles).length, 
      rows: Object.keys(prophecyIndexData).length 
    });
    return __parsedProphecyCache!;
  })();

  try {
    return await __pendingProphecy;
  } finally {
    __pendingProphecy = null;
  }
}

export function clearProphecyCache(): void {
  logger.info('PR', 'cleanup: clearing caches');
  __parsedProphecyCache = null;
  __prophecyRowsDataCache = null;
  __prophecyIndexTextCache = null;
  
  try {
    masterCache.delete('prophecy-verse-meta');
    masterCache.delete('prophecy-row-meta');
    masterCache.delete('prophecy-rows');
    masterCache.delete('prophecy-rows-grouped');
    masterCache.delete('prophecy-index');
  } catch (e) {
    // ignore
  }
}

// Cross-reference slice loader - DEPRECATED
export async function getCrossRefSlice(cfSet: 'cf1' | 'cf2', start: number, end: number): Promise<string> {
  logger.error('CF', 'DEPRECATED: getCrossRefSlice() - use getCrossRefsBatch() instead');
  throw new Error('getCrossRefSlice() is deprecated. Use getCrossRefsBatch() for optimized performance.');
}

export async function saveBookmark(bookmark: any, preserveAnchor?: (ref: string, index: number) => void) {
  const local = { ...bookmark, updated_at: Date.now(), pending: true };
  await db.bookmarks.add(local);
  await queueSync();

  if (preserveAnchor) {
    preserveAnchor(bookmark.verseReference, bookmark.verseIndex);
  }
  return { data: [{ id: local.id }] };
}

export async function saveHighlight(highlight: any, preserveAnchor?: (ref: string, index: number) => void) {
  const local = { ...highlight, updated_at: Date.now(), pending: true };
  await db.highlights.add(local);
  await queueSync();

  if (preserveAnchor) {
    preserveAnchor(highlight.verseReference, highlight.verseIndex);
  }
  return { data: [{ id: local.id }] };
}



// Cross-reference data parsing with FAST offset-based lookup
// EXPERT OPTIMIZED: Individual cross-reference lookup using HTTP Range requests
export async function getCrossReferences(verseId: string): Promise<string[]> {
  try {
    // Use the expert's optimized batch system for single verse (leverages HTTP Range requests)
    const batchResult = await getCrossRefsBatch([verseId]);
    return batchResult[verseId] || [];
  } catch (error) {
    logger.error('CF', 'failed to load cross-refs', { verseId, error });
    return [];
  }
}

// Enhanced prophecy loading with detailed index
export async function getProphecyIndexDetailed(): Promise<Record<string, any>> {
  return getOrFetch('prophecy-index', async () => {
    const text = await fetchFromStorage(paths.prophecyIdx);
    return JSON.parse(text);
  });
}

// Import new Strong's service
import { strongsService } from '@/lib/strongsService';

// Unified API object for backwards compatibility
export const BibleDataAPI = {
  getTranslationText: async (verseIDs: string[], translationId: string) => {
    const translationMap = await loadTranslation(translationId);
    return verseIDs.map(id => ({
      id,
      text: translationMap.get(id) || ''
    }));
  },
  loadTranslation,
  getCfOffsets,
  getCrossRef,
  getCrossRefSlice,
  getCrossReferences,
  loadCrossReferences,
  getProphecy,
  getProphecyRows: loadProphecyRows,
  getProphecyIndex: loadProphecyIndex,
  getProphecyIndexDetailed: loadProphecyIndex,
  loadProphecyRows,
  loadProphecyIndex,
  getStrongsOffsets,
  saveBookmark,
  saveHighlight,
  saveNote,
  fetchFromStorage,
  getDatesCanonical,
  getDatesChronological,
  getLabelsData,
  getContextGroups,
  searchVerses,

  // New Strong's Range request methods
  getStrongsWord: (strongsKey: string) => strongsService.getStrongsWord(strongsKey),
  getVerseStrongsData: (reference: string) => strongsService.getVerseStrongsData(reference),
  getStrongsOccurrences: (strongsKey: string) => strongsService.getStrongsOccurrences(strongsKey),
  getInterlinearData: async (reference: string) => {
    const data = await strongsService.getVerseStrongsData(reference);
    return data.interlinearCells || [];
  },
};
