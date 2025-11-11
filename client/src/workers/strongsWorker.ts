import { logger } from "@/lib/logger";
// Strong's Concordance Worker - handles heavy parsing off the main thread
// Based on IMPLEMENTATION_MAP.md Priority #4

interface StrongsWorkerMessage {
  type: 'VERSE' | 'LEMMA' | 'INIT';
  verseKey?: string;
  strongsId?: string;
  offsetsData?: {
    strongsVerseOffsets: Record<string, [number, number]>;
    strongsIndexOffsets: Record<string, [number, number]>;
  };
}

interface StrongsWordData {
  original: string;
  transliteration: string;
  strongs: string;
  definition: string;
  pronunciation: string;
}

interface StrongsVerseData {
  verseKey: string;
  words: StrongsWordData[];
}

let strongsVerseOffsets: Record<string, [number, number]> | null = null;
let strongsIndexOffsets: Record<string, [number, number]> | null = null;

// Initialize worker with offset data
self.onmessage = async (event: MessageEvent<StrongsWorkerMessage>) => {
  const { type, verseKey, strongsId, offsetsData } = event.data;

  try {
    switch (type) {
      case 'INIT':
        if (offsetsData) {
          strongsVerseOffsets = offsetsData.strongsVerseOffsets;
          strongsIndexOffsets = offsetsData.strongsIndexOffsets;
          self.postMessage({ type: 'INIT_SUCCESS' });
        }
        break;

      case 'VERSE':
        if (verseKey && strongsVerseOffsets) {
          const verseData = await fetchVerseStrongsData(verseKey);
          self.postMessage({ type: 'VERSE_RESULT', verseKey, data: verseData });
        }
        break;

      case 'LEMMA':
        if (strongsId && strongsIndexOffsets) {
          const lemmaData = await fetchLemmaData(strongsId);
          self.postMessage({ type: 'LEMMA_RESULT', strongsId, data: lemmaData });
        }
        break;

      default:
        self.postMessage({ type: 'ERROR', message: 'Unknown message type' });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Fetch Strong's data for a specific verse using byte range
async function fetchVerseStrongsData(verseKey: string): Promise<StrongsVerseData> {
  const offsets = strongsVerseOffsets?.[verseKey];
  if (!offsets) {
    return { verseKey, words: [] };
  }

  const [start, end] = offsets;
  
  // Make range request to Supabase Storage for this verse's Strong's data
  const response = await fetch(`${self.location.origin}/api/strongs/verses`, {
    headers: {
      'Range': `bytes=${start}-${end}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch verse Strong's data: ${response.status}`);
  }

  const rawData = await response.text();
  return parseVerseStrongsData(verseKey, rawData);
}

// Parse verse Strong's data from the raw text format
function parseVerseStrongsData(verseKey: string, rawData: string): StrongsVerseData {
  const words: StrongsWordData[] = [];
  
  // Parse the Strong's verse format (implementation depends on actual data format)
  // Expected format might be: word|transliteration|H1234|definition
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

// Fetch lemma data for a Strong's number
async function fetchLemmaData(strongsId: string): Promise<string[]> {
  const offsets = strongsIndexOffsets?.[strongsId];
  if (!offsets) {
    return [];
  }

  const [start, end] = offsets;
  
  // Make range request for this Strong's ID's verse list
  const response = await fetch(`${self.location.origin}/api/strongs/index`, {
    headers: {
      'Range': `bytes=${start}-${end}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch lemma data: ${response.status}`);
  }

  const rawData = await response.text();
  
  // Parse the list of verses that contain this Strong's number
  return rawData.trim().split('\n').filter(line => line.trim());
}

export {};