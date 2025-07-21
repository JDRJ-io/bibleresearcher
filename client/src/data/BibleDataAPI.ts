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

export async function fetchFromStorage(path: string): Promise<string> {
  const { data, error } = await supabase
    .storage
    .from(BUCKET)
    .download(path);

  if (error) throw new Error(`Supabase load failed → ${path}: ${error.message}`);
  return await data.text();
}

function getOrFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  if (masterCache.has(key)) {
    return Promise.resolve(masterCache.get(key));
  }
  
  return fetchFn().then(result => {
    masterCache.set(key, result);
    return result;
  });
}

export async function loadTranslation(id: string) {
  return getOrFetch(`translation-${id}`, async () => {
    const textData = await fetchFromStorage(paths.translation(id));
    const textMap = new Map<string, string>();
    
    // Parse the translation text format: "Gen.1:1 #In the beginning..."
    const lines = textData.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const cleanLine = line.trim().replace(/\r/g, '');
      const match = cleanLine.match(/^([^#]+)\s*#(.+)$/);
      if (match) {
        const [, reference, text] = match;
        const cleanRef = reference.trim();
        const cleanText = text.trim();
        
        // Store multiple key formats for compatibility
        textMap.set(cleanRef, cleanText); // "Gen.1:1"
        textMap.set(cleanRef.replace(".", " "), cleanText); // "Gen 1:1"
      }
    }
    
    return textMap;
  });
}

export async function loadTranslationAsText(id: string) {
  return getOrFetch(`translation-text-${id}`, async () => {
    return await fetchFromStorage(paths.translation(id));
  });
}

export async function loadVerseKeys() {
  return getOrFetch('verse-keys-canonical', async () => {
    const textData = await fetchFromStorage(paths.verseKeys);
    return JSON.parse(textData);
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
  return getOrFetch(`labels-${translation}`, async () => {
    const text = await fetchFromStorage(`labels/${translation}/ALL.json`);
    return JSON.parse(text);
  });
}

// Context boundaries - verse grouping data  
export async function getContextGroups(): Promise<any> {
  return getOrFetch('context-groups', async () => {
    const text = await fetchFromStorage('metadata/context_groups.json');
    return JSON.parse(text);
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



// Add cross-references data loading functionality  
export async function getCrossReferences(verseId: string): Promise<string[]> {
  try {
    // Load cf1 offsets first
    const offsets = await getCfOffsets('cf1');
    const verseOffset = offsets[verseId];
    
    if (!verseOffset) {
      return []; // No cross-references for this verse
    }
    
    // Load the specific verse's cross-reference line using slice
    const [start, end] = verseOffset;
    const crossRefLine = await getCrossRefSlice('cf1', start, end);
    
    // Parse format: Gen.1:1$$John.1:1#John.1:2#John.1:3$Heb.11:3
    const [baseVerse, referencesData] = crossRefLine.split('$$');
    if (!referencesData) return [];
    
    // Split by $ to get groups, then by # to get individual references
    const referenceGroups = referencesData.split('$');
    const allReferences: string[] = [];
    
    referenceGroups.forEach(group => {
      const refs = group.split('#');
      allReferences.push(...refs.filter(ref => ref.trim()));
    });
    
    console.log(`✅ Loaded ${allReferences.length} cross-references for ${verseId}`);
    return allReferences;
    
  } catch (error) {
    console.error(`❌ Error loading cross-references for ${verseId}:`, error);
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
  getProphecyRows,
  getProphecyIndex,
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
};