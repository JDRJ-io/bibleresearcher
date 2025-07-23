
// strongsVerses_fetch.ts - Hebrew-interlinear verse look-ups using Range requests
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
    
    // Try different reference formats to match what's actually in the offset map
    const referenceFormats = [
      ref,                                    // Original format
      ref.replace(/\s/g, '.'),               // "Gen 1:1" -> "Gen.1:1"  
      ref.replace(/\./g, ' '),               // "Gen.1:1" -> "Gen 1:1"
      ref.replace(/\s+/g, '.'),              // Handle multiple spaces
      ref.replace('Genesis', 'Gen').replace(/\s/g, '.'),
      ref.replace('Gen ', 'Gen.'),
    ];
    
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
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/anointed/strongs/strongsVerses.flat.txt.gz`,
      { 
        headers: { 
          'Range': `bytes=${start}-${end}`,
          'Accept-Encoding': 'gzip'
        } 
      }
    );
    
    if (response.status !== 206 && response.status !== 200) {
      throw new Error(`Verse range ${ref} failed: ${response.status}`);
    }
    
    const text = await response.text();
    console.log(`✅ Fetched interlinear data for verse ${ref}`);
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
  morphology?: string;
}

export function parseInterlinearVerse(raw: string): {
  reference: string;
  cells: InterlinearCell[];
} {
  try {
    // Format: "Gen.1:1#Hebrew In the beginning ×'Ö¼Ö°×¨Öµ××©×Ö´Ö–×™×ª (bÉ™Â·rÃªÂ·Å¡Ã®á¹¯) Preposition-b | Noun - feminine singular Strong's 7225: The first, in place, time, order, rank$God ×Ö±×œÖ¹×"Ö´Ö'×™× (â€™Ä•Â·lÅÂ·hÃ®m) Noun - masculine plural Strong's 430: gods -- the supreme God, magistrates, a superlative$..."
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
      
      // Extract morphology (text between transliteration and Strong's)
      const morphologyMatch = beforeStrongs.match(/\)\s+([^Strong's]+?)(?=\s*$)/);
      if (morphologyMatch) {
        morphology = morphologyMatch[1].trim();
      }
      
      cells.push({
        original: originalWord,
        transliteration: transliteration,
        gloss: englishWord || definition.split(',')[0] || '', // Use English word or first part of definition
        strongsNumber,
        strongsKey,
        morphology: morphology
      });
    }
    
    return { reference: reference || '', cells };
    
  } catch (error) {
    console.error('Error parsing interlinear verse:', error);
    return { reference: '', cells: [] };
  }
}
