// strongsVerses_fetch.ts - Hebrew-interlinear verse look-ups using Range requests
// Following expert's hand-off guide for gzip + offset system
import { masterCache } from './supabaseClient';

type VRange = [number, number];
let verseMap: Record<string, VRange> | null = null;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function getVerseMap(): Promise<Record<string, VRange>> {
  if (!verseMap) {
    const cached = masterCache.get('strongs-verses-offsets');
    if (cached) {
      verseMap = cached;
    } else {
      const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/public/anointed/strongs/strongsVersesOffsets.json`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch Strong's verses offsets: ${response.status}`);
      }
      verseMap = await response.json();
      masterCache.set('strongs-verses-offsets', verseMap);
    }
  }
  return verseMap!;
}

export async function fetchInterlinearVerse(ref: string): Promise<string> {
  try {
    console.log(`🔍 Fetching interlinear data for verse: ${ref}`);

    const offsetMap = await getVerseMap();

    // Debug: show available keys for the book
    const bookMatch = ref.match(/^([^.\s]+)/);
    if (bookMatch) {
      const bookPrefix = bookMatch[1];
      const availableKeys = Object.keys(offsetMap).filter(key => key.startsWith(bookPrefix)).slice(0, 5);
      console.log(`📋 Sample keys for ${bookPrefix}:`, availableKeys);
    }

    // OPTIMIZATION: ref is now in dot format - direct lookup only
    const referenceFormats = [ref];

    let range = null;
    let usedFormat = '';

    for (const format of referenceFormats) {
      range = offsetMap[format];
      if (range) {
        usedFormat = format;
        console.log(`✅ Found range using format: ${format}`);
        break;
      }
    }

    if (!range) {
      console.warn(`❌ No range found for verse: ${ref} in any format`);
      console.log(`📋 Total offset entries: ${Object.keys(offsetMap).length}`);
      return '';
    }

    const [start, end] = range;

    // Use the uploaded flat text file directly
    const flatUrl = `${SUPABASE_URL}/storage/v1/object/public/anointed/strongs/strongsverses.flat.txt`;

    const response = await fetch(flatUrl, { 
      headers: { 
        'Range': `bytes=${start}-${end}`
      } 
    });

    if (response.status !== 206 && response.status !== 200) {
      throw new Error(`Verse range ${usedFormat} failed: ${response.status}`);
    }

    // Direct text read - no decompression needed for flat files
    const text = await response.text();

    console.log(`✅ Successfully fetched interlinear data for verse ${usedFormat}`);
    return text.trim();

  } catch (error) {
    console.error(`❌ Error fetching interlinear verse ${ref}:`, error);
    return '';
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
        console.log(`🏷️ MORPHOLOGY CAPTURED for ${strongsKey}:`, morphology);
      } else {
        console.log(`❌ MORPHOLOGY FAILED for ${strongsKey}, beforeStrongs:`, beforeStrongs);
      }

      const cellData = {
        original: originalWord,
        transliteration: transliteration,
        gloss: englishWord || definition.split(',')[0] || '', // Use English word or first part of definition
        strongsNumber,
        strongsKey,
        morphology: morphology, // Full grammatical analysis: "Preposition-b | Noun - feminine singular"
        fullDefinition: definition // Complete Strong's definition: "The first, in place, time, order, rank"
      };

      console.log(`📊 CELL DATA for ${strongsKey}:`, cellData);
      cells.push(cellData);
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