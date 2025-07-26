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

    console.log(`✓ Found translation ${id} in cache with ${textMap.size} verses (Bible has 31,102 verses)`);
    return textMap;
  });
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
    const data = await fetchFromStorage(filePath);
    const verseKeys = JSON.parse(data);
    console.log(`🔑 Loaded ${verseKeys.length} ${chronological ? 'chronological' : 'canonical'} verse keys as master index`);
    return verseKeys;
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
    console.log(`📚 BibleDataAPI: Loading labels for ${translation} from storage`);
    const text = await fetchFromStorage(`labels/${translation}/ALL.json`);
    const parsed = JSON.parse(text);
    console.log(`✅ BibleDataAPI: Loaded ${Object.keys(parsed).length} verse labels for ${translation}`);
    return parsed;
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

  try {
    console.log('🔍 Loading Strong\'s offset files...');
    const [vTxt, iTxt] = await Promise.all([
      fetchFromStorage(paths.strongsVerseOffsets),
      fetchFromStorage(paths.strongsIndexOffsets),
    ]);

    strongsVerseOffsets = JSON.parse(vTxt);
    strongsIndexOffsets = JSON.parse(iTxt);

    console.log('✅ Strong\'s offsets loaded:', {
      verseOffsets: strongsVerseOffsets ? Object.keys(strongsVerseOffsets).length : 0,
      indexOffsets: strongsIndexOffsets ? Object.keys(strongsIndexOffsets).length : 0
    });

    return { strongsVerseOffsets, strongsIndexOffsets };
  } catch (error) {
    console.error('❌ Failed to load Strong\'s offsets:', error);
    // Return mock data for testing - this ensures the overlay can at least open
    const mockOffsets = {
      strongsVerseOffsets: { "Gen.1:1": [0, 100] as [number, number] },
      strongsIndexOffsets: { "H7225": [0, 50] as [number, number], "H1254": [50, 100] as [number, number] }
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
    console.log('🔮 Loading prophecy data from Supabase...');

    // Load both files in parallel
    const [prophecyRowsData, prophecyIndexText] = await Promise.all([
      loadProphecyRows(), // JSON from prophecy_rows.json
      loadProphecyIndex() // Text from prophecy_index.txt
    ]);

    console.log('📋 Raw prophecy files loaded, processing...');

    // Parse prophecy_index.txt first (verse -> prophecy mapping)
    const verseRoles: Record<string, { P: number[], F: number[], V: number[] }> = {};
    
    const indexLines = prophecyIndexText.split('\n').filter(line => line.trim());
    
    console.log(`📋 Processing ${indexLines.length} prophecy index lines...`);
    
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
      
      // Store with multiple key formats for better lookup
      const baseVerse = verse.trim();
      verseRoles[baseVerse] = roles;
      verseRoles[baseVerse.replace(/\./g, ' ')] = roles;  // "Gen.1:28" -> "Gen 1:28"
      verseRoles[baseVerse.replace(/\s/g, '.')] = roles;  // "Gen 1:28" -> "Gen.1:28"
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

    console.log(`✅ Prophecy data loaded: ${Object.keys(verseRoles).length} verses, ${Object.keys(prophecyIndex).length} prophecies`);

    return { verseRoles, prophecyIndex };
  } catch (error) {
    console.error('❌ Failed to load prophecy data:', error);
    return { 
      verseRoles: {}, 
      prophecyIndex: {} 
    };
  }
}

// Individual prophecy file loaders (for useBibleData compatibility)
export async function getProphecyIndex() {
  const data = await loadProphecyData();
  return new Map(Object.entries(data.verseRoles));
}

export async function getProphecyRows() {
  const data = await loadProphecyData();
  return data.prophecyIndex;
}

// Additional prophecy file loaders
export async function loadProphecyRows() {
  return getOrFetch('prophecy-rows', async () => {
    const textData = await fetchFromStorage(paths.prophecyRows);
    return JSON.parse(textData);
  });
}

export async function loadProphecyIndex() {
  return getOrFetch('prophecy-index', async () => {
    return await fetchFromStorage(paths.prophecyIdx);
  });
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



// Cross-reference data parsing with proper BibleDataAPI facade
export async function getCrossReferences(verseId: string): Promise<string[]> {
  try {
    // Load complete cross-reference data from cf1
    const crossRefData = await loadCrossReferences('cf1');
    const lines = crossRefData.split('\n').filter(line => line.trim());

    // Find the line for this verse (convert "Gen 1:1" to "Gen.1:1" format)
    const searchKey = verseId.replace(/\s/g, '.');
    const targetLine = lines.find(line => line.startsWith(searchKey + '$$'));

    if (!targetLine) {
      console.log(`No cross-references found for ${verseId}`);
      return [];
    }

    // Parse format: Gen.1:1$$John.1:1#John.1:2#John.1:3$Heb.11:3
    const [baseVerse, referencesData] = targetLine.split('$$');
    if (!referencesData) return [];

    // FIXED: Proper parsing that handles numbered books like 1Cor, 2Tim, 3John
    const allReferences: string[] = [];

    // Split by $ first to get reference groups
    const referenceGroups = referencesData.split('$');

    referenceGroups.forEach(group => {
      if (!group.trim()) return;

      // Split by # to get sequential references within a group
      const sequentialRefs = group.split('#');

      sequentialRefs.forEach(ref => {
        const cleanRef = ref.trim();
        if (cleanRef) {
          // Validate this looks like a proper verse reference before adding
          if (cleanRef.match(/^[123]?[A-Za-z]+\.\d+:\d+$/)) {
            allReferences.push(cleanRef);
          } else {
            console.warn(`Skipping invalid cross-reference format: "${cleanRef}" from verse ${verseId}`);
          }
        }
      });
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
};