// client/src/workers/crossReferencesWorker.ts
interface MessageRequest { id: string; sliceIDs: string[] }

// Legacy cache for backward compatibility
const crossRefsCache: Record<string, string[]> = {};

// MEMORY OPTIMIZED: Store offsets only, load verse data on-demand via byte-range requests
let crossRefOffsets: Record<string, [number, number]> | null = null;

function initializeCrossRefOffsets(offsets: Record<string, [number, number]>) {
  crossRefOffsets = offsets;
  console.log(`✅ Cross-reference offsets initialized: ${Object.keys(offsets).length} verses`);
}

// LEGACY: Keep old initialization for backward compatibility only
let crossRefsMap: Record<string, string[]> | null = null;

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

// MEMORY OPTIMIZED: No more "ensureCrossRefsLoaded" - use byte-range requests on demand
async function ensureOffsetsLoaded() {
  if (!crossRefOffsets) {
    console.warn('Cross-reference offsets not initialized. Waiting for main thread data...');
    crossRefOffsets = {};
  }
}

async function loadCrossRefs() {
  await ensureOffsetsLoaded();
}

async function fetchCrossRefs(ids: string[]): Promise<Record<string, string[]>> {
  await ensureOffsetsLoaded();
  const result: Record<string, string[]> = {};
  
  for (const id of ids) {
    // Use cached data or empty array if not loaded
    result[id] = crossRefsCache[id] || crossRefsMap?.[id] || [];
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
  
  // Handle initialization from main thread - MEMORY OPTIMIZED with offsets only
  if (type === 'init' && e.data.offsets) {
    initializeCrossRefOffsets(e.data.offsets);
    self.postMessage({ type: 'initialized' });
    return;
  }
  
  // Handle cross-reference queries - MEMORY OPTIMIZED byte-range approach
  if (type === 'query' && ids) {
    const result: Record<string, string[]> = {};
    
    // For now, return empty arrays (cross-references will be loaded via main thread byte-range requests)
    ids.forEach((id: string) => {
      result[id] = crossRefsCache[id] || [];
    });
    
    console.log(`📖 Cross-references query processed for ${ids.length} verses (memory-optimized mode)`);
    self.postMessage({ type: 'result', data: result });
    return;
  }
  
  // Legacy support for direct ids array
  if (ids && !type) {
    await ensureOffsetsLoaded();
    
    const result: Record<string, string[]> = {};
    ids.forEach((id: string) => {
      result[id] = crossRefsCache[id] || crossRefsMap?.[id] || [];
    });
    
    self.postMessage(result);
  }
};

export { loadCrossRefs, fetchCrossRefs };