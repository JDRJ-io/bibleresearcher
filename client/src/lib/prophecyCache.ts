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
    const [verseResp, rowResp] = await Promise.all([
      fetch('/api/references/prophecy_rows.txt').then(r => r.text()),
      fetch('/api/references/prophecy_index.json').then(r => r.json())
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
  
  const result: any[] = [];
  
  // Keep the { P,F,V } shape intact - don't normalize into array of objects
  if (verse.P) {
    verse.P.split(',').forEach(propId => {
      const data = rowMeta[propId];
      if (data) {
        result.push({
          role: 'P',
          summary: data.summary,
          prophecy: data.prophecy,
          fulfillment: data.fulfillment,
          verification: data.verification
        });
      }
    });
  }
  
  if (verse.F) {
    verse.F.split(',').forEach(propId => {
      const data = rowMeta[propId];
      if (data) {
        result.push({
          role: 'F', 
          summary: data.summary,
          prophecy: data.prophecy,
          fulfillment: data.fulfillment,
          verification: data.verification
        });
      }
    });
  }
  
  if (verse.V) {
    verse.V.split(',').forEach(propId => {
      const data = rowMeta[propId];
      if (data) {
        result.push({
          role: 'V',
          summary: data.summary,
          prophecy: data.prophecy,
          fulfillment: data.fulfillment,
          verification: data.verification
        });
      }
    });
  }
  
  return result;
}