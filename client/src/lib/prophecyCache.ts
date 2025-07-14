// client/src/lib/prophecyCache.ts

export interface ProphecyData {
  summary: string;
  prophecy: string[];
  fulfillment: string[];
  verification: string[];
}

let verseMeta: Record<string, { P: string; F: string; V: string }> | null = null;
let rowMeta: Record<string, ProphecyData> | null = null;

export async function ensureProphecyLoaded() {
  if (verseMeta && rowMeta) return;
  
  try {
    // Use BibleDataAPI for consistent data access
    const { getProphecyRows, getProphecyIndex } = await import('@/data/BibleDataAPI');
    
    const [verseResp, rowResp] = await Promise.all([
      getProphecyRows(),
      getProphecyIndex()
    ]);
    
    // Parse verseMeta
    verseMeta = {};
    verseResp.split('\n').forEach(line => {
      const [verse, data] = line.split('$');
      if (verse && data) {
        const items = data.split(',').map(item => {
          const [id, type] = item.split(':');
          return { id, type };
        });
        
        const blocks = items.reduce((acc, item) => {
          if (!acc[item.type]) acc[item.type] = [];
          acc[item.type].push(item.id);
          return acc;
        }, {} as Record<string, string[]>);
        
        verseMeta[verse] = {
          P: blocks.P ? blocks.P.join(',') : '',
          F: blocks.F ? blocks.F.join(',') : '',
          V: blocks.V ? blocks.V.join(',') : ''
        };
      }
    });
    
    rowMeta = rowResp;
    console.log('✅ Prophecy data loaded successfully via BibleDataAPI');
  } catch (error) {
    console.error('Failed to load prophecy data from authentic source:', error);
    // Don't fall back to mock data - keep empty
    verseMeta = {};
    rowMeta = {};
  }
}

export function getProphecyForVerse(id: string) {
  if (!verseMeta || !rowMeta) return [];
  
  const verse = verseMeta[id];
  if (!verse) return [];
  
  // Return role-grouped prophecy data
  const prophecyMap: Record<string, any> = {};
  
  if (verse.P) {
    const pIds = verse.P.split(',').filter(id => id.trim());
    prophecyMap[id] = { P: pIds, F: [], V: [] };
  }
  
  if (verse.F) {
    const fIds = verse.F.split(',').filter(id => id.trim());
    if (!prophecyMap[id]) prophecyMap[id] = { P: [], F: [], V: [] };
    prophecyMap[id].F = fIds;
  }
  
  if (verse.V) {
    const vIds = verse.V.split(',').filter(id => id.trim());
    if (!prophecyMap[id]) prophecyMap[id] = { P: [], F: [], V: [] };
    prophecyMap[id].V = vIds;
  }
  
  return prophecyMap[id] ? [prophecyMap[id]] : [];
}