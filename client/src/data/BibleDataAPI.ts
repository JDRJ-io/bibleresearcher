import { supabase, masterCache } from '@/lib/supabaseClient';
import { db } from '@/offline/offlineDB';
import { queueSync } from '@/offline/queueSync';

// CANONICAL BUCKET PATHS - SINGLE SOURCE OF TRUTH
const BUCKET = 'anointed';

const paths = {
  translation:  (id: string) => `translations/${id}.txt`,
  crossRef:     (set: 'cf1' | 'cf2') => `references/${set}.txt`,
  prophecyRows: 'references/prophecy_rows.txt',
  prophecyIdx:  'references/prophecy_index.json',
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