import { supabase, masterCache } from '@/lib/supabaseClient';
import { db } from '@/offline/offlineDB';
import { queueSync } from '@/offline/queueSync';

// CANONICAL BUCKET PATHS - SINGLE SOURCE OF TRUTH
const BUCKET = 'anointed';

const paths = {
  translation:  (id: string) => `translations/${id}.txt`,
  crossRef:     (set: 'cf1' | 'cf2') => `references/${set}.txt`,
  crossRefOffsets: (set: 'cf1' | 'cf2') => `references/${set}_offsets.json`,
  prophecyRows: 'references/prophecy_rows.txt',
  prophecyIdx:  'references/prophecy_index.json',
  strongsVerseOffsets: 'references/strongsVerseOffsets.json',
  strongsIndexOffsets: 'references/strongsIndexOffsets.json',
  verseKeys:    'metadata/verseKeys-canonical.json',
  verseKeysChronological: 'metadata/verseKeys-chronological.json',
  datesCanonical: 'metadata/dates-canonical.txt',
  datesChronological: 'metadata/dates-chronological.txt',
};

// ARCHITECTURE: Master verse keys array for anchor-centered loading
let masterVerseKeys: string[] = [];
let currentAnchorIndex = 0;

// MEMORY OPTIMIZED: fetchFromStorage with byte-range support 
export async function fetchFromStorage(path: string, options?: { start?: number, end?: number }): Promise<string> {
  if (options?.start !== undefined && options?.end !== undefined) {
    // Byte-range request for memory efficiency
    console.log(`🌐 fetchFromStorage: ${path} (bytes ${options.start}-${options.end})`);
    const { data, error } = await supabase
      .storage
      .from(BUCKET)
      .download(path, {
        transform: {
          range: `bytes=${options.start}-${options.end}`
        }
      });
    
    if (error) throw new Error(`Supabase range load failed → ${path}: ${error.message}`);
    return await data.text();
  }
  
  // Standard full file download (only for small files like offsets)
  console.log(`🌐 fetchFromStorage: ${path}`);
  const { data, error } = await supabase
    .storage
    .from(BUCKET)
    .download(path);

  if (error) throw new Error(`Supabase load failed → ${path}: ${error.message}`);
  return await data.text();
}

// Promise deduplication to prevent multiple concurrent fetches
const pendingLoads: Record<string, Promise<any>> = {};

function getOrFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  if (masterCache.has(key)) {
    return Promise.resolve(masterCache.get(key));
  }
  
  // Promise deduplication - if already loading, return existing promise
  if (key in pendingLoads) {
    return pendingLoads[key];
  }
  
  pendingLoads[key] = fetchFn().then(result => {
    masterCache.set(key, result);
    delete pendingLoads[key]; // Clean up
    return result;
  }).catch(error => {
    delete pendingLoads[key]; // Clean up on error too
    throw error;
  });
  
  return pendingLoads[key];
}

// DOCUMENTED: loadChunk(anchorIndex, ±100) - anchor-centered loading pattern
export async function loadChunk(anchorIndex: number, sliceSize: number = 100): Promise<{
  verseKeys: string[],
  chunks: Map<string, Map<string, string>>
}> {
  // Ensure we have master verse keys
  if (masterVerseKeys.length === 0) {
    masterVerseKeys = await loadVerseKeys();
  }
  
  // Calculate slice boundaries around anchor
  const start = Math.max(0, anchorIndex - sliceSize);
  const end = Math.min(masterVerseKeys.length, anchorIndex + sliceSize + 1);
  const sliceKeys = masterVerseKeys.slice(start, end);
  
  console.log(`📊 loadChunk: anchor=${anchorIndex}, slice=${start}-${end}, verses=${sliceKeys.length}`);
  
  // Return verse keys for this chunk - text loaded on demand per translation
  return {
    verseKeys: sliceKeys,
    chunks: new Map() // Empty - will be populated by getTranslationText()
  };
}

// DOCUMENTED: getTranslation(id) - Primary documented method per FILE_CONNECTIONS_MAP.md
export async function getTranslation(translationId: string): Promise<Map<string, string>> {
  const cacheKey = `translation-${translationId}`;
  
  return await getOrFetch(cacheKey, async () => {
    const fullText = await fetchFromStorage(paths.translation(translationId));
    const verseMap = new Map<string, string>();
    const lines = fullText.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const cleanLine = line.trim().replace(/\r/g, '');
      const match = cleanLine.match(/^([^#]+)\s*#(.+)$/);
      if (match) {
        const [, reference, text] = match;
        const cleanRef = reference.trim();
        const cleanText = text.trim();
        
        // Store both formats for compatibility
        verseMap.set(cleanRef, cleanText);
        verseMap.set(cleanRef.replace(".", " "), cleanText);
      }
    }
    
    console.log(`📖 Translation ${translationId} loaded: ${verseMap.size} verses`);
    return verseMap;
  });
}

// Legacy alias for backward compatibility 
export const loadTranslation = getTranslation;

export async function loadTranslationAsText(id: string) {
  return getOrFetch(`translation-text-${id}`, async () => {
    return await fetchFromStorage(paths.translation(id));
  });
}

// DOCUMENTED: Primary verse keys loader - loads master index
export async function loadVerseKeys(order: 'canonical' | 'chronological' = 'canonical'): Promise<string[]> {
  const cacheKey = `verse-keys-${order}`;
  return getOrFetch(cacheKey, async () => {
    const path = order === 'canonical' ? paths.verseKeys : paths.verseKeysChronological;
    const textData = await fetchFromStorage(path);
    const keys = JSON.parse(textData);
    
    // Set master keys if this is canonical
    if (order === 'canonical') {
      masterVerseKeys = keys;
    }
    
    console.log(`📑 Loaded ${keys.length} ${order} verse keys`);
    return keys;
  });
}

// DOCUMENTED: getVerseMeta() - get metadata for specific verse
export async function getVerseMeta(verseKey: string): Promise<{
  dates?: string;
  contextGroup?: string;
  strongsData?: any;
}> {
  // Load metadata files as needed
  const meta: any = {};
  
  try {
    // Load dates if available
    const datesText = await getOrFetch('dates-canonical', async () => {
      return await fetchFromStorage(paths.datesCanonical);
    });
    
    // Find verse index and get corresponding date
    if (masterVerseKeys.length === 0) {
      masterVerseKeys = await loadVerseKeys();
    }
    
    const verseIndex = masterVerseKeys.indexOf(verseKey);
    if (verseIndex >= 0) {
      const dateLines = datesText.split('\n');
      if (dateLines[verseIndex]) {
        meta.dates = dateLines[verseIndex].trim();
      }
    }
  } catch (error) {
    console.warn('Could not load verse dates:', error);
  }
  
  return meta;
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

// MEMORY OPTIMIZED: Cross-reference byte-range loading only
// DO NOT load entire 6MB+ files - use offsets for 2-4KB slices only
export async function loadCrossRefOffsets(set: 'cf1' | 'cf2' = 'cf1') {
  return getOrFetch(`crossref-offsets-${set}`, async () => {
    const offsetData = await fetchFromStorage(paths.crossRefOffsets(set));
    return JSON.parse(offsetData);
  });
}

// DOCUMENTED: getCrossRefSlice(verseIDs) - FAST byte-range requests for cross-reference data
export async function getCrossRefSlice(verseIDs: string[]): Promise<Record<string, string[]>> {
  if (verseIDs.length === 0) return {};
  
  console.log(`🔗 getCrossRefSlice(${verseIDs.length} verses) - MEMORY OPTIMIZED`);
  
  const offsets = await loadCrossRefOffsets('cf1');
  const result: Record<string, string[]> = {};
  
  // Process verses in parallel for better performance
  const promises = verseIDs.map(async (verseID) => {
    if (!offsets[verseID]) {
      result[verseID] = [];
      return;
    }
    
    const [start, end] = offsets[verseID];
    try {
      const slice = await fetchFromStorageRange(paths.cf1, start, end);
      
      // Parse cross-reference format: Gen.1:1$$John.1:1#John.1:2#John.1:3$Heb.11:3
      if (slice.includes('$$')) {
        const refsStr = slice.split('$$')[1];
        if (refsStr) {
          const allRefs = refsStr.split('$')
            .flatMap(group => group.includes('#') ? group.split('#') : [group])
            .map(ref => ref.trim())
            .filter(ref => ref.length > 0);
          
          result[verseID] = allRefs;
          return;
        }
      }
      result[verseID] = [];
    } catch (error) {
      console.warn(`Failed to load cross-ref for ${verseID}:`, error);
      result[verseID] = [];
    }
  });
  
  await Promise.all(promises);
  console.log(`🔗 Loaded cross-refs for ${Object.keys(result).filter(k => result[k].length > 0).length}/${verseIDs.length} verses`);
  return result;
}

// DOCUMENTED: Ensure translation loaded - uses main getTranslation method
export async function ensureTranslationLoaded(translationId: string): Promise<Map<string, string>> {
  console.log(`🔄 Ensuring translation ${translationId} is loaded...`);
  const translation = await getTranslation(translationId);
  console.log(`✅ Translation ${translationId} ensured loaded: ${translation.size} verses`);
  return translation;
}

// Legacy method - DEPRECATED to prevent memory bloat
export async function getCrossRef(set: 'cf1' | 'cf2' = 'cf1'): Promise<string> {
  throw new Error(`getCrossRef() DEPRECATED - use getCrossRefSlice() for byte-range requests only`);
}

// DOCUMENTED: getCfOffsets(set) - alias for loadCrossRefOffsets
export async function getCfOffsets(set: 'cf1' | 'cf2'): Promise<any> {
  return await loadCrossRefOffsets(set);
}

// Prophecy loading with proper caching
export async function loadProphecyRows(): Promise<string> {
  return getOrFetch('prophecy-rows', async () => {
    return await fetchFromStorage(paths.prophecyRows);
  });
}

export async function loadProphecyIndex(): Promise<any> {
  return getOrFetch('prophecy-index', async () => {
    const textData = await fetchFromStorage(paths.prophecyIdx);
    return JSON.parse(textData);
  });
}

// Get prophecy data for BibleDataAPI facade - redirect to load functions

export async function loadProphecySlice(start: number, end: number) {
  // Remove obsolete slice loaders
  console.warn('loadProphecySlice is deprecated, use prophecyCache instead');
  return {};
}

export async function saveNotes(note: any, preserveAnchor?: (ref: string, index: number) => void) {
  const result = await supabase.from('notes').upsert(note);
  if (preserveAnchor) {
    preserveAnchor(note.verseReference, note.verseIndex);
  }
  return result;
}



// READ - with offline fallback
export async function getNotes(): Promise<any[]> {
  const local = await db.notes.toArray();
  if (!navigator.onLine) return local;

  const { data, error } = await supabase.from('notes').select('*');
  if (error) return local; // Fall back

  await db.notes.clear();
  await db.notes.bulkAdd(data.map((n: any) => ({ ...n, pending: false })));
  return data;
}

// DOCUMENTED: getProphecyRows() - loads prophecy_rows.txt for P/F/V mapping
export async function getProphecyRows(): Promise<string> {
  return await loadProphecyRows();
}

// DOCUMENTED: getProphecyIndex() - loads prophecy_index.json for metadata  
export async function getProphecyIndex(): Promise<any> {
  return await loadProphecyIndex();
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
const cfOffsetsCache = new Map<'cf1' | 'cf2', Record<string, [number, number]>>();



// -------- Strong's offsets ----------
let strongsVerseOffsets: Record<string, [number, number]> | null = null;
let strongsIndexOffsets: Record<string, [number, number]> | null = null;

// DOCUMENTED: getStrongsOffsets() - returns verse & lemma ranges for Strong's concordance
export async function getStrongsOffsets(): Promise<{ 
  strongsVerseOffsets: Record<string, [number, number]>, 
  strongsIndexOffsets: Record<string, [number, number]> 
}> {
  if (strongsVerseOffsets && strongsIndexOffsets) {
    return { strongsVerseOffsets, strongsIndexOffsets };
  }

  const [vTxt, iTxt] = await Promise.all([
    fetchFromStorage(paths.strongsVerseOffsets),
    fetchFromStorage(paths.strongsIndexOffsets),
  ]);

  strongsVerseOffsets = JSON.parse(vTxt);
  strongsIndexOffsets = JSON.parse(iTxt);
  
  console.log(`🔍 Strong's offsets loaded: ${Object.keys(strongsVerseOffsets).length} verses, ${Object.keys(strongsIndexOffsets).length} lemmas`);
  return { strongsVerseOffsets, strongsIndexOffsets };
}

// -------- Prophecy loaders ----------
let prophecyIndex: Record<string, [number, number]> | null = null;
let prophecyRowsTxt: string | null = null;

// DOCUMENTED: getProphecy(key) - TSV row P/F/V from prophecy system  
export async function getProphecy(indexKey: string): Promise<string | null> {
  // Lazy load index JSON
  if (!prophecyIndex) {
    const idx = await fetchFromStorage(paths.prophecyIdx);
    prophecyIndex = JSON.parse(idx);
    console.log(`📜 Prophecy index loaded: ${Object.keys(prophecyIndex).length} entries`);
  }
  // Lazy load rows file
  if (!prophecyRowsTxt) {
    prophecyRowsTxt = await fetchFromStorage(paths.prophecyRows);
    console.log(`📜 Prophecy rows loaded: ${prophecyRowsTxt.length} bytes`);
  }
  
  const slice = prophecyIndex![indexKey];
  if (!slice) {
    console.warn(`⚠️ Prophecy key not found: ${indexKey}`);
    return null;
  }
  
  const result = prophecyRowsTxt!.substring(slice[0], slice[1]);
  console.log(`📜 getProphecy(${indexKey}) → ${result.length} chars`);
  return result;
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
  getCrossRefSlice,
  loadCrossRefOffsets,
  getProphecy,
  getProphecyRows,
  getProphecyIndex,
  loadProphecyRows,
  loadProphecyIndex,
  getStrongsOffsets,
  saveBookmark,
  saveHighlight,
  saveNote,
  fetchFromStorage
};