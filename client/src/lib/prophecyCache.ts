// client/src/lib/prophecyCache.ts
import { masterCache } from './supabaseClient';

export interface ProphecyData {
  summary: string;
  prophecy: string[];
  fulfillment: string[];
  verification: string[];
}

// Use master cache instead of local variables
const PROPHECY_VERSE_META_KEY = 'prophecy-verse-meta';
const PROPHECY_ROW_META_KEY = 'prophecy-row-meta';

export async function ensureProphecyLoaded() {
  if (masterCache.has(PROPHECY_VERSE_META_KEY) && masterCache.has(PROPHECY_ROW_META_KEY)) {
    console.log('📜 Prophecy data already cached');
    return;
  }
  
  try {
    console.log('📜 Loading prophecy data via BibleDataAPI...');
    // Use BibleDataAPI for consistent data access
    const { getProphecyRows, getProphecyIndex } = await import('@/data/BibleDataAPI');
    
    const [verseResp, rowResp] = await Promise.all([
      getProphecyRows(),
      getProphecyIndex()
    ]);
    
    // Parse verseMeta from prophecy_rows.txt format
    const verseMeta: Record<string, { P: number[]; F: number[]; V: number[] }> = {};
    const lines = verseResp.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      if (line.includes('$')) {
        const [verse, data] = line.split('$');
        if (verse && data) {
          const cleanVerse = verse.trim();
          const items = data.split(',').map(item => {
            const [id, type] = item.trim().split(':');
            return { id: parseInt(id), type: type?.trim() };
          }).filter(item => !isNaN(item.id) && item.type);
          
          const blocks = items.reduce((acc, item) => {
            if (!acc[item.type]) acc[item.type] = [];
            acc[item.type].push(item.id);
            return acc;
          }, {} as Record<string, number[]>);
          
          verseMeta[cleanVerse] = {
            P: blocks.P || [],
            F: blocks.F || [],
            V: blocks.V || []
          };
        }
      }
    });
    
    // Store in master cache
    masterCache.set(PROPHECY_VERSE_META_KEY, verseMeta);
    masterCache.set(PROPHECY_ROW_META_KEY, rowResp);
    console.log(`📜 Prophecy data loaded: ${Object.keys(verseMeta).length} verses with prophecy references`);
  } catch (error) {
    console.error('Failed to load prophecy data from authentic source:', error);
    // Don't fall back to mock data - keep empty
    masterCache.set(PROPHECY_VERSE_META_KEY, {});
    masterCache.set(PROPHECY_ROW_META_KEY, {});
  }
}

export function getProphecyForVerse(id: string): { P: number[], F: number[], V: number[] } {
  const verseMeta = masterCache.get(PROPHECY_VERSE_META_KEY) || {};
  
  if (!verseMeta) {
    return { P: [], F: [], V: [] };
  }
  
  const verse = verseMeta[id];
  if (!verse) {
    return { P: [], F: [], V: [] };
  }
  
  return {
    P: verse.P || [],
    F: verse.F || [],
    V: verse.V || []
  };
}

export function hasProphecyData(id: string): boolean {
  const data = getProphecyForVerse(id);
  return data.P.length > 0 || data.F.length > 0 || data.V.length > 0;
}