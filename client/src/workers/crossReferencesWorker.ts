// client/src/workers/crossReferencesWorker.ts
interface MessageRequest { id: string; sliceIDs: string[] }

let crossRefsMap: Record<string, string[]> | null = null;

async function ensureCrossRefsLoaded() {
  if (crossRefsMap) return;
  
  try {
    const response = await fetch('/api/references/cf1.txt');
    if (!response.ok) throw new Error(`Failed to fetch cross-references: ${response.status}`);
    const text = await response.text();
    
    crossRefsMap = {};
    text.split('\n').forEach(line => {
      const [verseID, refsStr] = line.split('$$');
      if (verseID && refsStr) {
        // Parse cross-references with $ and # delimiters
        const groups = refsStr.split('$');
        const allRefs: string[] = [];
        
        groups.forEach(group => {
          if (group.includes('#')) {
            allRefs.push(...group.split('#'));
          } else {
            allRefs.push(group);
          }
        });
        
        crossRefsMap[verseID] = allRefs.filter(ref => ref.trim()).map(ref => ref.trim());
      }
    });
    
    console.log('✅ Cross-references loaded successfully');
  } catch (error) {
    console.error('Failed to load cross-references:', error);
    crossRefsMap = {};
  }
}

async function loadCrossRefs() {
  await ensureCrossRefsLoaded();
}

async function fetchCrossRefs(ids: string[]): Promise<Record<string, string[]>> {
  await ensureCrossRefsLoaded();
  const result: Record<string, string[]> = {};
  
  for (const id of ids) {
    result[id] = crossRefsMap[id] || [];
  }
  
  console.log(`📖 Cross-references fetched for ${ids.length} verses, ${Object.keys(result).filter(k => result[k].length > 0).length} have data`);
  return result;
}

// Classic worker pattern with self.onmessage and self.postMessage
self.onmessage = async (e: { data: MessageRequest }) => {
  const { id, sliceIDs } = e.data;
  const result = await fetchCrossRefs(sliceIDs);
  self.postMessage({ id, result });
};

export { loadCrossRefs, fetchCrossRefs };