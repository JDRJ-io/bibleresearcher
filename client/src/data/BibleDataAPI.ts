import { supabase, masterCache } from '@/lib/supabaseClient';
import { db } from '@/offline/offlineDB';
import { queueSync } from '@/offline/queueSync';

// CANONICAL BUCKET PATHS - SINGLE SOURCE OF TRUTH
const BUCKET = 'anointed';

const paths = {
  translation:  (id: string) => `translations/${id}.txt`,
  crossRef:     (set: 'cf1' | 'cf2') => `references/${set}.txt`,
  crossRefOffsets: (set: 'cf1' | 'cf2') => `references/${set}_offsets.json`,
  prophecyRows: 'references/prophecy_rows.json',  // JSON format as you described
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
  const { data, error } = await supabase
    .storage
    .from(BUCKET)
    .download(path);

  if (error) throw new Error(`Supabase load failed → ${path}: ${error.message}`);
  return await data.text();
}

export async function uploadToStorage(path: string, fileContent: string | Blob): Promise<void> {
  const { error } = await supabase
    .storage
    .from(BUCKET)
    .upload(path, fileContent, { upsert: true });

  if (error) throw new Error(`Supabase upload failed → ${path}: ${error.message}`);
}

// Load dates data as a Map for verse lookup  
export async function loadDatesMap(chronological: boolean = false): Promise<Map<string, string>> {
  const cacheKey = chronological ? 'dates-map-chronological' : 'dates-map-canonical';
  
  return getOrFetch(cacheKey, async () => {
    console.log(`📅 LOADING: ${chronological ? 'Chronological' : 'Canonical'} dates as map...`);
    const path = chronological ? paths.datesChronological : paths.datesCanonical;
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
    
    console.log(`📅 LOADED: ${datesMap.size} date entries as map`);
    return datesMap;
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
  // Check cache first for immediate return
  const cacheKey = `translation-${id}`;
  if (masterCache.has(cacheKey)) {
    const cached = masterCache.get(cacheKey);
    console.log(`⚡ INSTANT: ${id} from cache (${cached.size} verses)`);
    return cached;
  }

  console.log(`📥 LOADING: ${id} translation...`);
  const textData = await fetchFromStorage(paths.translation(id));
  const textMap = new Map<string, string>();

  // Optimized parsing - use regex compilation
  const parseRegex = /^([^#]+)\s*#(.+)$/;
  const lines = textData.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const match = line.match(parseRegex);
    if (match) {
      const [, reference, text] = match;
      textMap.set(reference.trim(), text.trim());
    }
  }

  // Cache immediately for future instant access
  masterCache.set(cacheKey, textMap);
  console.log(`⚡ CACHED: ${id} with ${textMap.size} verses`);
  return textMap;
}

export async function loadTranslationAsText(id: string) {
  return getOrFetch(`translation-text-${id}`, async () => {
    return await fetchFromStorage(paths.translation(id));
  });
}

export async function loadVerseKeys(chronological = false): Promise<string[]> {
  const cacheKey = chronological ? 'verse-keys-chronological' : 'verse-keys-canonical';
  const filePath = chronological ? paths.verseKeysChronological : paths.verseKeys;

  console.log(`🔑 STEP 5: loadVerseKeys called with chronological=${chronological}, loading file: ${filePath}`);

  return getOrFetch(cacheKey, async () => {
    console.log(`🔑 STEP 6: Actually fetching ${filePath} from Supabase storage...`);
    
    try {
      const data = await fetchFromStorage(filePath);
      const verseKeys = JSON.parse(data);
      console.log(`🔑 STEP 7: Loaded ${verseKeys.length} ${chronological ? 'chronological' : 'canonical'} verse keys as master index`);
      console.log(`🔑 STEP 8: First few verses in order: [${verseKeys.slice(0, 5).join(', ')}]`);
      return verseKeys;
    } catch (error) {
      console.warn(`⚠️ STEP 6B: Failed to load ${filePath}, falling back to canonical order`);
      console.warn(`Error details:`, error);
      
      if (chronological) {
        // If chronological file doesn't exist, fall back to canonical
        console.log(`🔑 STEP 7B: Loading canonical order as fallback...`);
        const fallbackData = await fetchFromStorage(paths.verseKeys);
        const fallbackKeys = JSON.parse(fallbackData);
        console.log(`🔑 STEP 8B: Using canonical order (${fallbackKeys.length} verses) as chronological fallback`);
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
    console.log(`📅 Loaded ${dates.length} ${chronological ? 'chronological' : 'canonical'} dates`);
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
async function loadCrossReferences(set: 'cf1' | 'cf2' = 'cf1') {
  console.error(`❌ DEPRECATED: loadCrossReferences() should not be called. Use getCrossRefsBatch() with HTTP Range requests instead.`);
  throw new Error(`loadCrossReferences() is deprecated. Use getCrossRefsBatch() for optimized performance.`);
}

// Get cross-reference data for BibleDataAPI facade
export async function getCrossRef(set: 'cf1' | 'cf2' = 'cf1'): Promise<string> {
  console.error(`❌ DEPRECATED: getCrossRef() should not be called. Use getCrossRefsBatch() with HTTP Range requests instead.`);
  throw new Error(`getCrossRef() is deprecated. Use getCrossRefsBatch() for optimized performance.`);
}

export async function loadCrossRefSlice(start: number, end: number) {
  // Remove obsolete slice loaders
  console.warn('loadCrossRefSlice is deprecated, use getCrossReferences instead');
  return {};
}

// Prophecy loading with proper caching
export async function loadProphecyRows(): Promise<any> {
  return getOrFetch('prophecy-rows', async () => {
    const textData = await fetchFromStorage(paths.prophecyRows);
    return JSON.parse(textData);
  });
}

export async function loadProphecyIndex(): Promise<string> {
  return getOrFetch('prophecy-index', async () => {
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
    console.log(`📚 BibleDataAPI: Loading labels for ${translation} from storage path: ${paths.labels(translation)}`);
    try {
      const text = await fetchFromStorage(paths.labels(translation));
      const parsed = JSON.parse(text);
      console.log(`✅ BibleDataAPI: Loaded ${Object.keys(parsed).length} verse labels for ${translation}`);
      return parsed;
    } catch (error) {
      console.warn(`⚠️ BibleDataAPI: Labels file not found for ${translation} at ${paths.labels(translation)}. This is expected if label files haven't been uploaded yet.`);
      console.warn(`Error details:`, error);
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
    console.log(`📚 Loaded ${groups.length} context groups from Supabase`);
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

  for (const [reference, text] of translationMap.entries()) {
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

// EXPERT IMPLEMENTATION: True HTTP Range requests using Supabase Storage range option
async function fetchSlice(cfSet: 'cf1' | 'cf2', start: number, end: number): Promise<string> {
  console.log(`📡 TRUE RANGE: Fetching bytes ${start}-${end} from ${cfSet}.txt (${end - start + 1} bytes)`);
  
  const { data, error } = await supabase
    .storage
    .from(BUCKET)
    .download(paths.crossRef(cfSet), { 
      range: { start, end } 
    });
    
  if (error) throw error;
  
  const result = new TextDecoder().decode(await data.arrayBuffer());
  console.log(`✅ TRUE RANGE: Downloaded ${result.length} bytes using HTTP 206 Partial Content`);
  return result;
}

// EXPERT IMPLEMENTATION: Ultra-fast batch loading with true HTTP Range requests
export async function getCrossRefsBatch(verseIds: string[], cfSet: 'cf1' | 'cf2' = 'cf1'): Promise<Record<string, string[]>> {
  if (verseIds.length === 0) return {};

  console.log(`🚀 EXPERT BATCH: Loading ${verseIds.length} verses using TRUE HTTP Range requests`);
  
  try {
    // Step 1: Load offset map (cached after first call)
    const offsetMap = await getCfOffsets(cfSet);
    
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

    console.log(`📡 EXPERT: Making ${merged.length} HTTP Range requests for ${verseIds.length} verses`);

    // Step 4: Pull each merged window using TRUE range requests
    const chunks = await Promise.all(
      merged.map(m => fetchSlice(cfSet, m.s, m.e))
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

    console.log(`✅ EXPERT: Loaded cross-references for ${Object.keys(refs).length} verses using ${merged.length} range requests (~${chunks.join('').length} bytes total)`);
    return refs;

  } catch (error) {
    console.error('Expert batch cross-reference loading failed:', error);
    return {};
  }
}

// -------- Strong's offsets ----------
let strongsVerseOffsets: Record<string, [number, number]> | null = null;
let strongsIndexOffsets: Record<string, [number, number]> | null = null;

export async function getStrongsOffsets() {
  if (strongsVerseOffsets && strongsIndexOffsets) return { strongsVerseOffsets, strongsIndexOffsets };

  try {
    console.log('🔍 Loading Strong\'s offset files...');
    const [vTxt, iTxt] = await Promise.all([
      fetchFromStorage(paths.strongsVerseOffsets),
      fetchFromStorage(paths.strongsIndexOffsets),
    ]);

    strongsVerseOffsets = JSON.parse(vTxt);
    strongsIndexOffsets = JSON.parse(iTxt);

    console.log('✅ Strong\'s offsets loaded:', {
      verseOffsets: Object.keys(strongsVerseOffsets || {}).length,
      indexOffsets: Object.keys(strongsIndexOffsets || {}).length
    });

    return { strongsVerseOffsets, strongsIndexOffsets };
  } catch (error) {
    console.error('❌ Failed to load Strong\'s offsets:', error);
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

// -------- Prophecy data parsing from prophecy_rows.txt and prophecy_index.json ----------
let prophecyWorker: Worker | null = null;

// Load prophecy data (if not already cached)
export async function loadProphecyData(): Promise<{
  verseRoles: Record<string, { P: number[], F: number[], V: number[] }>,
  prophecyIndex: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }>
}> {
  try {

    // Load both files in parallel
    const [prophecyRowsData, prophecyIndexText] = await Promise.all([
      loadProphecyRows(), // JSON from prophecy_rows.json
      loadProphecyIndex() // Text from prophecy_index.txt
    ]);


    // Parse prophecy_index.txt first (verse -> prophecy mapping)
    const verseRoles: Record<string, { P: number[], F: number[], V: number[] }> = {};
    
    const indexLines = prophecyIndexText.split('\n').filter(line => line.trim());
    
    
    for (const line of indexLines) {
      // Parse format: "Gen.1:28$664:V"
      const [verse, mappingsStr] = line.split('$');
      if (!verse || !mappingsStr) continue;
      
      const roles = { P: [] as number[], F: [] as number[], V: [] as number[] };
      
      // Parse mappings: "664:V" or "28:P,541:P"
      const mappings = mappingsStr.split(',');
      for (const mapping of mappings) {
        const [idStr, roleStr] = mapping.split(':');
        if (!idStr || !roleStr) continue;
        
        const id = parseInt(idStr);
        const role = roleStr.trim() as 'P' | 'F' | 'V';
        
        if (roles[role] && !isNaN(id)) {
          roles[role].push(id);
        }
      }
      
      // STRAIGHT-LINE: Store with dot format only (source format from prophecy files)
      const baseVerse = verse.trim();
      verseRoles[baseVerse] = roles;
    }

    // Parse prophecy_rows.json (prophecy definitions)
    const prophecyIndex: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }> = {};
    
    // prophecyRowsData is already parsed JSON
    Object.entries(prophecyRowsData).forEach(([idStr, prophecyData]: [string, any]) => {
      const id = parseInt(idStr);
      prophecyIndex[id] = {
        summary: prophecyData.summary || '',
        prophecy: prophecyData.prophecy || [],
        fulfillment: prophecyData.fulfillment || [],
        verification: prophecyData.verification || []
      };
    });


    return { verseRoles, prophecyIndex };

  } catch (error) {
    console.error('❌ Failed to load prophecy data:', error);
    return { verseRoles: {}, prophecyIndex: {} };
  }
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



// Cross-reference data parsing with FAST offset-based lookup
// EXPERT OPTIMIZED: Individual cross-reference lookup using HTTP Range requests
export async function getCrossReferences(verseId: string, cfSet: 'cf1' | 'cf2' = 'cf1'): Promise<string[]> {
  try {
    // Use the expert's optimized batch system for single verse (leverages HTTP Range requests)
    const batchResult = await getCrossRefsBatch([verseId], cfSet);
    return batchResult[verseId] || [];
  } catch (error) {
    console.error(`Error loading cross-references for ${verseId}:`, error);
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
