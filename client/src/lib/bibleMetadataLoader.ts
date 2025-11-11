import { logger } from './logger';

export interface BibleMetadata {
  verseRef: string;
  dateWritten: string;
  placeWritten: string;
  authors: string;
  audienceContext: string;
  verificationVerses: string;
}

let metadataCache: Map<string, BibleMetadata> | null = null;

export async function loadBibleMetadata(): Promise<Map<string, BibleMetadata>> {
  if (metadataCache) {
    return metadataCache;
  }

  try {
    const url = 'https://ecaqvxbbscwcxbjpfrdm.supabase.co/storage/v1/object/public/anointed/metadata/Bible_Data.txt';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch bible metadata: ${response.statusText}`);
    }

    const text = await response.text();
    const lines = text.split('\n');
    
    metadataCache = new Map();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const parts = trimmed.split('%');
      if (parts.length < 6) continue;

      const verseRef = parts[0].trim();
      const metadata: BibleMetadata = {
        verseRef,
        dateWritten: parts[1].trim(),
        placeWritten: parts[2].trim(),
        authors: parts[3].trim(),
        audienceContext: parts[4].trim(),
        verificationVerses: parts[5].trim(),
      };

      metadataCache.set(verseRef, metadata);
    }

    logger.debug('METADATA', 'Bible metadata loaded', { count: metadataCache.size });
    return metadataCache;
  } catch (error) {
    logger.error('METADATA', 'Failed to load bible metadata', error);
    metadataCache = new Map();
    return metadataCache;
  }
}

export function getBibleMetadata(verseRef: string): BibleMetadata | undefined {
  return metadataCache?.get(verseRef);
}

export function parseVerseRanges(verificationVerses: string): Array<{ display: string; refs: string[] }> {
  if (!verificationVerses) return [];
  
  const groups = verificationVerses.split('$');
  const result: Array<{ display: string; refs: string[] }> = [];
  
  const parseRef = (ref: string): { book: string; chapter: string; verse: string } | null => {
    const match = ref.match(/^(.+?)\.(\d+):(\d+)$/);
    if (!match) return null;
    return { book: match[1], chapter: match[2], verse: match[3] };
  };
  
  for (const group of groups) {
    const trimmed = group.trim();
    if (!trimmed) continue;
    
    const verses = trimmed.split('#');
    if (verses.length === 1) {
      result.push({ display: verses[0], refs: [verses[0]] });
    } else {
      const firstVerse = verses[0];
      const lastVerse = verses[verses.length - 1];
      
      const first = parseRef(firstVerse);
      const last = parseRef(lastVerse);
      
      let display = firstVerse;
      if (first && last) {
        if (first.book === last.book && first.chapter === last.chapter) {
          display = `${first.book}.${first.chapter}:${first.verse}-${last.verse}`;
        } else if (first.book === last.book) {
          display = `${first.book}.${first.chapter}:${first.verse}-${last.chapter}:${last.verse}`;
        } else {
          display = `${firstVerse}-${lastVerse}`;
        }
      }
      
      result.push({ display, refs: verses });
    }
  }
  
  return result;
}
