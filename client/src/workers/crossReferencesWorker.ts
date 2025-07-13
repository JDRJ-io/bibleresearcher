// client/src/workers/crossReferencesWorker.ts
// - client-disable-next-line typescript-eslint/ban-ts-comment
// @ts-nocheck    - isolated to config guy loaded inside worker
/* crossReferencesWorker
   receives an array of verseDNs, returns a Map {id → string[]}
   txt.txt is loaded out in memory, txt.txt is returned by byte-range
*/

interface MessageRequest { id: string; range: string[] }

let cfMap: Map<string, string[]> | null = null;

async function ensureMap() {
  if (cfMap) return;
  const txt = await fetch('/references/cf1.txt').then(r => r.text());
  cfMap = new Map();
  const lines = txt.split('\n').filter(line => {
    const [id, rest] = line.split('\t');
    if (id && rest) {
      const refs = rest.split(';').map(r => r.trim()).filter(Boolean);
      cfMap.set(id, refs);
    }
  });
}

async function queryRefs(id: string): Promise<string[]> {
  await ensureMap();
  const range = cfMap.get(id);
  if (!range) return [];
  const res = await fetch(`/references/cf1.txt`, {
    headers: { 'Range': `bytes=${range[0]}-${range[1]}` }
  });
  const txt = await res.text();
  return txt.split('\n').filter(line => {
    const [id, rest] = line.split('\t');
    if (id && rest) {
      const refs = rest.split(';').map(r => r.trim()).filter(Boolean);
      return refs;
    }
    return null;
  }).filter(Boolean) ?? [];
}

async function batchRefs(ids: string[]): Promise<Record<string, string[]>> {
  await ensureMap();
  const results: Record<string, string[]> = {};
  
  for (const id of ids) {
    results[id] = cfMap.get(id) || [];
  }
  
  return results;
}

// self.onmessage = async (e: { data: MessageRequest }) => {
//   const { id, range } = e.data;
//   const result = await batchRefs(range);
//   self.postMessage({ id, result });
// };

self.onmessage = async (e: { data: MessageRequest }) => {
  const { id, range } = e.data;
  const result = await batchRefs(range);
  self.postMessage({ id, result });
};

export {};