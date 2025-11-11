// strongsIndex_fetch.ts - lemma look-ups using Range requests
import { masterCache } from './supabaseClient';

// Re-export from strongsVerses_fetch to avoid circular imports
export { fetchInterlinearVerse, parseInterlinearVerse, type InterlinearCell } from './strongsVerses_fetch';

type Range = [number, number];
let idxMap: Record<string, Range> | null = null;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function getIdxMap(): Promise<Record<string, Range>> {
  if (!idxMap) {
    const cached = masterCache.get('strongs-index-offsets');
    if (cached) {
      idxMap = cached;
    } else {
      const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/public/anointed/strongs/strongsIndexOffsets.json`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch Strong's index offsets: ${response.status}`);
      }
      idxMap = await response.json();
      masterCache.set('strongs-index-offsets', idxMap);
    }
  }
  return idxMap!;
}

export async function fetchLemma(key: string): Promise<string[]> {
  try {
    console.log(`🔍 Fetching Strong's lemma data for: ${key}`);

    const offsetMap = await getIdxMap();
    const range = offsetMap[key];

    if (!range) {
      console.warn(`❌ No range found for Strong's key: ${key}`);
      return [];
    }

    const [start, end] = range;
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/anointed/strongs/strongsIndex.flat.txt`,
      { 
        headers: { 
          'Range': `bytes=${start}-${end}`
        } 
      }
    );

    if (response.status !== 206 && response.status !== 200) {
      throw new Error(`Strong's lemma range ${key} failed: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n').filter(line => line.trim());

    console.log(`✅ Fetched ${lines.length} occurrences for Strong's ${key}`);
    return lines;

  } catch (error) {
    console.error(`❌ Error fetching Strong's lemma ${key}:`, error);
    return [];
  }
}

// Parse a Strong's occurrence line
export interface StrongsOccurrence {
  original: string;
  strongsNumber: string;
  transliteration: string;
  gloss: string;
  reference: string;
  context: string;
  morphology?: string; // Added for morphology-based sorting
}

export function parseStrongsOccurrence(line: string): StrongsOccurrence | null {
  try {
    // Format: "|Greek|1|Ἄλφα|Alpha|Rev.1:8|Alpha|"I am the **Alpha** and the Omega," says the Lord God, who is and was and is to come—the Almighty.|"
    const parts = line.split('|');

    if (parts.length < 7) {
      console.warn('Invalid Strong\'s occurrence format:', line);
      return null;
    }

    return {
      original: parts[3] || '',           // Ἄλφα
      strongsNumber: parts[2] || '',      // 1
      transliteration: parts[4] || '',    // Alpha
      gloss: parts[4] || '',              // Alpha (same as transliteration for this format)
      reference: parts[5] || '',          // Rev.1:8
      context: parts.slice(6).join('|') || '' // The rest as context
    };
  } catch (error) {
    console.error('Error parsing Strong\'s occurrence:', error);
    return null;
  }
}

// Range request for lemma occurrences using gzip + offset system
export async function fetchLemmaOccurrences(strongsId: string): Promise<string[]> {
  const indexMap = await getIndexMap();
  const range = indexMap[strongsId];

  if (!range) {
    console.warn(`No Strong's index data found for: ${strongsId}`);
    return [];
  }

  const [start, end] = range;

  console.log(`🔍 Fetching Strong's index for ${strongsId} at bytes ${start}-${end}`);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/anointed/strongs/strongsindex.flat.txt.gz?download=1&noDownload=true`,
      {
        headers: {
          'Range-Unit': 'bytes',
          'Range': `bytes=${start}-${end}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Range request failed: ${response.status}`);
    }

    // Pipe through gunzip decompression
    const stream = response.body!.pipeThrough(new DecompressionStream('gzip'));
    const rawData = await new Response(stream).text();

    return parseLemmaData(strongsId, rawData);

  } catch (error) {
    console.error(`❌ Failed to fetch Strong's index for ${strongsId}:`, error);
    return [];
  }
}