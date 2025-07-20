// client/src/workers/crossReferencesWorker.ts
interface MessageRequest { id: string; sliceIDs: string[] }

// Legacy cache for backward compatibility
const crossRefsCache: Record<string, string[]> = {};

let crossRefsMap: Record<string, string[]> | null = null;

// Initialize cross-references data from main thread
// Data Format (from replit.md): Gen.1:1$$John.1:1#John.1:2#John.1:3$Heb.11:3
function initializeCrossRefs(cf1Data: string) {
  if (crossRefsMap) return;
  
  try {
    crossRefsMap = {};
    const lines = cf1Data.split('\n').filter(line => line.trim());
    let parsedCount = 0;
    
    lines.forEach((line, index) => {
      if (line.includes('$$')) {
        const [verseID, refsStr] = line.split('$$', 2); // Only split on first $$
        const trimmedVerseID = verseID.trim();
        
        if (trimmedVerseID && refsStr && refsStr.trim()) {
          // Parse cross-references with $ and # delimiters according to spec
          const groups = refsStr.split('$');
          const allRefs: string[] = [];
          
          groups.forEach(group => {
            const trimmedGroup = group.trim();
            if (trimmedGroup) {
              if (trimmedGroup.includes('#')) {
                // Split by # for sequential references in this group
                const sequentialRefs = trimmedGroup.split('#');
                sequentialRefs.forEach(ref => {
                  const trimmedRef = ref.trim();
                  if (trimmedRef) {
                    allRefs.push(trimmedRef);
                  }
                });
              } else {
                // Single reference in this group
                allRefs.push(trimmedGroup);
              }
            }
          });
          
          const cleanRefs = allRefs.filter(ref => ref.trim()).map(ref => ref.trim());
          if (cleanRefs.length > 0 && crossRefsMap) {
            crossRefsMap[trimmedVerseID] = cleanRefs;
            crossRefsCache[trimmedVerseID] = cleanRefs; // Also populate legacy cache
            parsedCount++;
            
            // Debug log for first few entries
            if (index < 5) {
              console.log(`✓ CrossRef Worker: ${trimmedVerseID} -> ${cleanRefs.length} refs: ${cleanRefs.slice(0, 3).join(', ')}${cleanRefs.length > 3 ? '...' : ''}`);
            }
          }
        }
      }
    });
    
    console.log(`✅ Cross-references initialized in worker: ${parsedCount} verses with references from ${lines.length} lines`);
  } catch (error) {
    console.error('❌ Failed to initialize cross-references:', error);
    crossRefsMap = {};
  }
}

async function ensureCrossRefsLoaded() {
  // Cross-references should be initialized via postMessage from main thread
  if (!crossRefsMap) {
    console.warn('Cross-references not initialized. Waiting for main thread data...');
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
    result[id] = crossRefsMap?.[id] || [];
  }
  
  console.log(`📖 Cross-references fetched for ${ids.length} verses, ${Object.keys(result).filter(k => result[k].length > 0).length} have data`);
  return result;
}

/* client/src/workers/crossReferencesWorker.ts */
self.onmessage = async (e) => {
  const { type, data, ids, key, text } = e.data;
  
  // Step 4: Worker round-trip test
  if (type === 'ping') {
    self.postMessage('pong');
    return;
  }
  
  // Handle cross-reference data slice from main thread
  if (type === 'cfData') {
    const refs = text.split('|').filter((ref: string) => ref.trim());
    crossRefsCache[key] = refs;
    self.postMessage({ key, refs });
    return;
  }
  
  // Handle initialization from main thread
  if (type === 'init') {
    initializeCrossRefs(data);
    self.postMessage({ type: 'initialized' });
    return;
  }
  
  // Handle cross-reference queries
  if (type === 'query' && ids) {
    await ensureCrossRefsLoaded();
    
    const result: Record<string, string[]> = {};
    ids.forEach((id: string) => {
      result[id] = crossRefsMap?.[id] || crossRefsCache[id] || [];
    });
    
    console.log(`📖 Cross-references fetched for ${ids.length} verses, ${Object.keys(result).filter(k => result[k].length > 0).length} have data`);
    self.postMessage({ type: 'result', data: result });
    return;
  }
  
  // Legacy support for direct ids array
  if (ids && !type) {
    await ensureCrossRefsLoaded();
    
    const result: Record<string, string[]> = {};
    ids.forEach((id: string) => {
      result[id] = crossRefsMap?.[id] || crossRefsCache[id] || [];
    });
    
    self.postMessage(result);
  }
};

export { loadCrossRefs, fetchCrossRefs };