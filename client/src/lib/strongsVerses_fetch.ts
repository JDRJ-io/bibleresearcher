
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
    const range = offsetMap[ref];
    
    if (!range) {
      console.warn(`❌ No range found for verse: ${ref}`);
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
    // Format: "1Kgs.14:16#Hebrew And he will give …$Israel …$on account …$of the sins …$Jeroboam …"
    const [reference, hebrewPart] = raw.split('#', 2);
    
    if (!hebrewPart) {
      return { reference: reference || '', cells: [] };
    }
    
    const cellStrings = hebrewPart.split('$').filter(cell => cell.trim());
    const cells: InterlinearCell[] = [];
    
    for (const cellStr of cellStrings) {
      // Extract Strong's number from patterns like "Strong's 3478:" or "Strong's H3478:"
      const strongsMatch = cellStr.match(/Strong's (?:H|G)?(\d+):/);
      if (!strongsMatch) continue;
      
      const strongsNumber = strongsMatch[1];
      const isHebrew = cellStr.includes('Hebrew') || strongsMatch[0].includes('H');
      const strongsKey = `${isHebrew ? 'H' : 'G'}${strongsNumber}`;
      
      // Parse the cell content - this will need refinement based on actual format
      const parts = cellStr.split(/\s+/);
      
      cells.push({
        original: parts[0] || '',
        transliteration: parts[1] || '',
        gloss: parts[2] || '',
        strongsNumber,
        strongsKey,
        morphology: parts[3] || ''
      });
    }
    
    return { reference: reference || '', cells };
    
  } catch (error) {
    console.error('Error parsing interlinear verse:', error);
    return { reference: '', cells: [] };
  }
}
