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

export async function fetchFromStorage(path: string): Promise<string> {
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
  if (pendingLoads[key]) {
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

// DOCUMENTED: getTranslationText() - load specific translation for verses
export async function getTranslationText(translationId: string, verseKeys: string[]): Promise<Map<string, string>> {
  const cacheKey = `translation-slice-${translationId}-${verseKeys.length}`;
  
  return await getOrFetch(cacheKey, async () => {
    // Load only the needed slice, not entire translation
    const verseMap = new Map<string, string>();
    
    // For now, load full translation but only return requested verses
    // TODO: Implement byte-range requests for true efficiency
    const fullText = await fetchFromStorage(paths.translation(translationId));
    const lines = fullText.split('\n').filter(line => line.trim());
    
    // Parse only needed verses
    const neededSet = new Set(verseKeys);
    for (const line of lines) {
      const cleanLine = line.trim().replace(/\r/g, '');
      const match = cleanLine.match(/^([^#]+)\s*#(.+)$/);
      if (match) {
        const [, reference, text] = match;
        const cleanRef = reference.trim();
        const cleanText = text.trim();
        
        // Only store if in our needed set
        if (neededSet.has(cleanRef) || neededSet.has(cleanRef.replace(".", " "))) {
          verseMap.set(cleanRef, cleanText);
          verseMap.set(cleanRef.replace(".", " "), cleanText);
        }
      }
    }
    
    console.log(`📖 Translation slice ${translationId}: ${verseMap.size} verses loaded for ${verseKeys.length} requested`);
    return verseMap;
  });
}

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

// Cross-reference loading with proper caching
export async function loadCrossReferences(set: 'cf1' | 'cf2' = 'cf1') {
  return getOrFetch(`crossref-${set}`, async () => {
    return await fetchFromStorage(paths.crossRef(set));
  });
}

// Get cross-reference data for BibleDataAPI facade
export async function getCrossRef(set: 'cf1' | 'cf2' = 'cf1'): Promise<string> {
  return await loadCrossReferences(set);
}

// DOCUMENTED: Get translation for current anchor slice
export async function ensureTranslationLoaded(translationId: string, verseKeys?: string[]): Promise<Map<string, string>> {
  console.log(`🔄 Ensuring translation ${translationId} is loaded...`);
  
  if (!verseKeys || verseKeys.length === 0) {
    // Load a default small slice around current anchor
    const chunk = await loadChunk(currentAnchorIndex, 50);
    verseKeys = chunk.verseKeys;
  }
  
  const translation = await getTranslationText(translationId, verseKeys);
  console.log(`✅ Translation ${translationId} ensured loaded: ${translation.size} verses`);
  return translation;
}

// Get translation from cache (no network calls) - deprecated in favor of slice loading
export function getTranslation(translationId: string): Map<string, string> | null {
  const cacheKey = `translation-slice-${translationId}`;
  return masterCache.get(cacheKey) || null;
}

export async function loadCrossRefSlice(start: number, end: number) {
  // Remove obsolete slice loaders
  console.warn('loadCrossRefSlice is deprecated, use crossRefsWorker instead');
  return {};
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

// Get prophecy data for BibleDataAPI facade
export async function getProphecyRows(): Promise<string> {
  return await loadProphecyRows();
}

export async function getProphecyIndex(): Promise<any> {
  return await loadProphecyIndex();
}

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

export async function getCfOffsets(set: 'cf1' | 'cf2') {
  if (cfOffsetsCache.has(set)) return cfOffsetsCache.get(set)!;
  const path = paths.crossRefOffsets(set);
  const txt = await fetchFromStorage(path);
  const obj = JSON.parse(txt) as Record<string, [number, number]>;
  cfOffsetsCache.set(set, obj);
  return obj;
}

// -------- Strong's offsets ----------
let strongsVerseOffsets: Record<string, [number, number]> | null = null;
let strongsIndexOffsets: Record<string, [number, number]> | null = null;

export async function getStrongsOffsets() {
  if (strongsVerseOffsets && strongsIndexOffsets) return { strongsVerseOffsets, strongsIndexOffsets };

  const [vTxt, iTxt] = await Promise.all([
    fetchFromStorage(paths.strongsVerseOffsets),
    fetchFromStorage(paths.strongsIndexOffsets),
  ]);

  strongsVerseOffsets = JSON.parse(vTxt);
  strongsIndexOffsets = JSON.parse(iTxt);
  return { strongsVerseOffsets, strongsIndexOffsets };
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

// Cross-reference slice loader
export async function getCrossRefSlice(cfSet: 'cf1' | 'cf2', start: number, end: number): Promise<string> {
  const fullText = await loadCrossReferences(cfSet);
  return fullText.substring(start, end);
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
  getCrossRef,
  getCrossRefSlice,
  loadCrossReferences,
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