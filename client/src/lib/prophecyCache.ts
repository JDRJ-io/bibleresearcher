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
  
  const [verseResp, rowResp] = await Promise.all([
    fetch('/references/prophecy_rows.txt').then(r => r.text()),
    fetch('/references/prophecy_index.json').then(r => r.json())
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
}

export function getProphecyForVerse(id: string) {
  if (!verseMeta || !rowMeta) return [];
  
  const verse = verseMeta[id];
  if (!verse) return [];
  
  const result: ProphecyData[] = [];
  
  [verse.P, verse.F, verse.V].forEach((ids, index) => {
    const type = ['P', 'F', 'V'][index];
    if (ids) {
      ids.split(',').forEach(id => {
        const data = rowMeta[id];
        if (data) {
          result.push({
            summary: data.summary,
            prophecy: data.prophecy,
            fulfillment: data.fulfillment,
            verification: data.verification
          });
        }
      });
    }
  });
  
  return result;
}