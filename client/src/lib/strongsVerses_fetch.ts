// strongsVerses_fetch.ts - Hebrew-interlinear verse look-ups using Range requests
// Following expert's hand-off guide for gzip + offset system
import { masterCache } from './supabaseClient';

type VRange = [number, number];
let verseMap: Record<string, VRange> | null = null;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Import types from strongsService to maintain consistency
interface StrongsWordData {
  original: string;
  transliteration: string;
  strongs: string;
  definition: string;
  pronunciation: string;
}

export interface StrongsVerseData {
  verseKey: string;
  words: StrongsWordData[];
}

async function getVerseMap(): Promise<Record<string, VRange>> {
  if (!verseMap) {
    const cached = masterCache.get('strongs-verses-offsets');
    if (cached) {
      verseMap = cached;
    } else {
      const offsetUrl = `${SUPABASE_URL}/storage/v1/object/public/anointed/strongs/strongsVersesOffsets.json`;
      const response = await fetch(offsetUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Strong's verses offsets: ${response.status}`);
      }
      
      verseMap = await response.json();
      masterCache.set('strongs-verses-offsets', verseMap);
    }
  }
  return verseMap!;
}

const FLAT_URL = `${SUPABASE_URL}/storage/v1/object/public/anointed/strongs/strongsverses.flat.txt`;

// ---- NEVER REJECT ----
let flatSizePromise: Promise<number | null> | null = null;
async function getFlatSize(): Promise<number | null> {
  if (!flatSizePromise) {
    flatSizePromise = (async () => {
      try {
        const r = await fetch(FLAT_URL, { headers: { Range: "bytes=0-0" } });
        const cr = r.headers.get("Content-Range"); // "bytes 0-0/1234567"
        if (!cr) return null;
        const parts = cr.split("/");
        const size = parts.length === 2 ? parseInt(parts[1], 10) : NaN;
        return Number.isFinite(size) ? size : null;
      } catch {
        return null;
      }
    })();
  }
  return flatSizePromise;
}

function makeRangeHeader(start: number, end: number | null) {
  return end == null ? `bytes=${start}-` : `bytes=${start}-${end}`;
}

async function fetchRangeSafe(startIn: number, endIn?: number | null): Promise<string> {
  const size = await getFlatSize(); // may be null
  const start = Math.max(0, startIn | 0);
  let end = endIn == null ? null : Math.max(start, endIn | 0);

  if (size != null) {
    if (start >= size) return "";            // beyond EOF -> no fetch
    if (end != null && end >= size) end = size - 1;
  }

  // *** KEY: catch around fetch creation & await in the SAME microtask ***
  const tryOnce = async (rangeStr: string) => {
    try {
      // Wrap fetch in promise to ensure errors are caught in this context
      const res = await fetch(FLAT_URL, { headers: { Range: rangeStr } }).catch((err) => {
        // Return a failed response object instead of rejecting
        return { ok: false, status: -1, text: async () => "" } as Response;
      });
      
      if (!res.ok) return { ok: false as const, status: res.status, text: "" };
      
      try {
        const text = await res.text();
        return { ok: true as const, status: res.status, text };
      } catch {
        return { ok: false as const, status: res.status ?? -2, text: "" };
      }
    } catch {
      return { ok: false as const, status: -3, text: "" };
    }
  };

  // 1) clamped attempt
  const a1 = await tryOnce(makeRangeHeader(start, end));
  if (a1.ok) return a1.text;

  // 2) open-ended retry (can't be unsatisfiable unless start>=size, which we guarded)
  const a2 = await tryOnce(makeRangeHeader(start, null));
  if (a2.ok) return a2.text;

  console.warn("[strongs] range fetch failed (soft)", {
    startIn, endIn, start, end, status1: a1.status, status2: a2.status
  });
  return "";
}

// Use fetchRangeSafe() wherever you previously did the range fetch:
export async function fetchInterlinearVerse(ref: string): Promise<string> {
  try {
    const offsetMap = await getVerseMap();            // your existing index
    const range = offsetMap[ref];
    if (!range) {
      // Some verses don't have interlinear data - this is normal
      return '';
    }
    
    const [s, e] = range;
    const text = await fetchRangeSafe(s, e);
    return text.trim();
  } catch {
    return "";                                  // never throw to callers
  }
}

// Parse interlinear verse data
export interface InterlinearCell {
  original: string;
  transliteration: string;
  gloss: string;
  strongsNumber: string;
  strongsKey: string; // G#### or H####
  morphology?: string; // Full grammatical analysis (e.g., "Preposition-b | Noun - feminine singular")
  syntax?: string; // Syntax role (e.g., "modifier", "subject", "verb")
  fullDefinition?: string; // Complete Strong's definition (e.g., "The first, in place, time, order, rank")
}

export function parseInterlinearVerse(raw: string): {
  reference: string;
  cells: InterlinearCell[];
} {
  try {
    // Format: "Gen.1:1#Hebrew In the beginning בְּרֵאשִׁית (bə·rê·šîṯ) Preposition-b | Noun - feminine singular Strong's 7225: The first, in place, time, order, rank$God אֱלֹהִים (ʾĕ·lō·hîm) Noun - masculine plural Strong's 430: gods -- the supreme God, magistrates, a superlative$..."
    const [reference, content] = raw.split('#', 2);

    if (!content) {
      return { reference: reference || '', cells: [] };
    }

    // Remove "Hebrew" or "Greek" language marker
    const cleanContent = content.replace(/^(Hebrew|Greek)\s+/, '');
    const cellStrings = cleanContent.split('$').filter(cell => cell.trim());
    const cells: InterlinearCell[] = [];

    for (const cellStr of cellStrings) {
      const trimmedCell = cellStr.trim();
      if (!trimmedCell) continue;

      // Extract Strong's number from patterns like "Strong's 7225:"
      const strongsMatch = trimmedCell.match(/Strong's (\d+):/);
      if (!strongsMatch) continue;

      const strongsNumber = strongsMatch[1];
      const isHebrew = content.includes('Hebrew') || !content.includes('Greek');
      const strongsKey = `${isHebrew ? 'H' : 'G'}${strongsNumber}`;

      // Parse the format: "English word Hebrew (transliteration) morphology Strong's number: definition"
      const strongsIndex = trimmedCell.indexOf("Strong's");
      const beforeStrongs = trimmedCell.substring(0, strongsIndex).trim();
      const afterStrongs = trimmedCell.substring(strongsIndex);

      // Extract definition after the colon
      const definitionMatch = afterStrongs.match(/Strong's \d+:\s*(.+)$/);
      const definition = definitionMatch ? definitionMatch[1].trim() : '';

      // Parse the part before Strong's reference
      const parts = beforeStrongs.split(/\s+/);
      let englishWord = '';
      let originalWord = '';
      let transliteration = '';
      let morphology = '';

      // Look for Hebrew/Greek text (contains non-ASCII characters)
      const originalWordMatch = beforeStrongs.match(/([\u0590-\u05FF\u0370-\u03FF\u1F00-\u1FFF]+)/);
      if (originalWordMatch) {
        originalWord = originalWordMatch[1];
      }

      // Look for transliteration in parentheses
      const transliterationMatch = beforeStrongs.match(/\(([^)]+)\)/);
      if (transliterationMatch) {
        transliteration = transliterationMatch[1];
      }

      // Extract English word (first part before Hebrew/Greek)
      const englishMatch = beforeStrongs.match(/^([a-zA-Z\s]+?)(?=\s+[\u0590-\u05FF\u0370-\u03FF\u1F00-\u1FFF])/);
      if (englishMatch) {
        englishWord = englishMatch[1].trim();
      }

      // Extract morphology (text after transliteration closing parenthesis)
      // Pattern: ") Preposition-b | Noun - feminine singular" (everything after the closing parenthesis)
      const morphologyMatch = beforeStrongs.match(/\)\s+(.+)$/);
      if (morphologyMatch) {
        morphology = morphologyMatch[1].trim();
      }

      // Extract syntax information from the |syntax": "value" pattern
      const syntaxMatch = trimmedCell.match(/\|syntax":\s*"([^"]+)"/);
      const syntax = syntaxMatch ? syntaxMatch[1] : undefined;

      cells.push({
        original: originalWord,
        transliteration: transliteration,
        gloss: englishWord || definition.split(',')[0] || '', // Use English word or first part of definition
        strongsNumber,
        strongsKey,
        morphology: morphology, // Full grammatical analysis: "Preposition-b | Noun - feminine singular"
        syntax: syntax, // Syntax role: "modifier", "subject", "verb", etc.
        fullDefinition: definition // Complete Strong's definition: "The first, in place, time, order, rank"
      });
    }

    return { reference: reference || '', cells };

  } catch (error) {
    console.error('Error parsing interlinear verse:', error);
    return { reference: '', cells: [] };
  }
}

// Range request for verse data using gzip + offset system
export async function fetchVerseStrongsData(verseKey: string): Promise<StrongsVerseData> {
  const verseMap = await getVerseMap();
  const range = verseMap[verseKey];

  if (!range) {
    console.warn(`No Strong's data found for verse: ${verseKey}`);
    return { verseKey, words: [] };
  }

  const [start, end] = range;

  console.log(`🔍 Fetching Strong's data for ${verseKey} at bytes ${start}-${end}`);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/anointed/strongs/strongsverses.flat.txt.gz?download=1&noDownload=true`,
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

    return parseVerseStrongsData(verseKey, rawData);

  } catch (error) {
    console.error(`❌ Failed to fetch Strong's data for ${verseKey}:`, error);
    return { verseKey, words: [] };
  }
}

// Parse Strong's verse data from the raw text format
function parseVerseStrongsData(verseKey: string, rawData: string): StrongsVerseData {
  const words: StrongsWordData[] = [];
  
  // Parse the Strong's verse format
  const lines = rawData.trim().split('\n');
  
  for (const line of lines) {
    if (line.includes('|')) {
      const parts = line.split('|');
      if (parts.length >= 4) {
        words.push({
          original: parts[0] || '',
          transliteration: parts[1] || '',
          strongs: parts[2] || '',
          definition: parts[3] || '',
          pronunciation: parts[4] || ''
        });
      }
    }
  }

  return { verseKey, words };
}