import { logger } from "@/lib/logger";
// client/src/workers/crossReferencesWorker.ts
interface MessageRequest { id: string; sliceIDs: string[] }

// Legacy cache for backward compatibility
const crossRefsCache: Record<string, string[]> = {};

let crossRefsMap: Record<string, string[]> | null = null;

// Initialize cross-references data from main thread
function initializeCrossRefs(cf1Data: string) {
  if (crossRefsMap) return;
  
  try {
    crossRefsMap = {};
    cf1Data.split('\n').forEach(line => {
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
        
        const cleanRefs = allRefs.filter(ref => ref.trim()).map(ref => ref.trim());
        crossRefsMap[verseID] = cleanRefs;
        crossRefsCache[verseID] = cleanRefs; // Also populate legacy cache
      }
    });
    
    logger.debug('SW', '✅ Cross-references initialized in worker');
  } catch (error) {
    logger.error('SW', 'Failed to initialize cross-references:', error);
    crossRefsMap = {};
  }
}

async function ensureCrossRefsLoaded() {
  // Cross-references should be initialized via postMessage from main thread
  if (!crossRefsMap) {
    logger.warn('SW', 'Cross-references not initialized. Waiting for main thread data...');
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
  
  logger.debug('SW', `📖 Cross-references fetched for ${ids.length} verses, ${Object.keys(result).filter(k => result[k].length > 0).length} have data`);
  return result;
}

/* client/src/workers/crossReferencesWorker.ts */
self.onmessage = async (e) => {
  const { type, data, ids, key, text } = e.data;
  
  // Step 4: Worker round-trip test
  if (type === 'ping') {
    (self as DedicatedWorkerGlobalScope).postMessage('pong');
    return;
  }
  
  // Handle cross-reference data slice from main thread
  if (type === 'cfData') {
    const refs = text.split('|').filter((ref: string) => ref.trim());
    crossRefsCache[key] = refs;
    (self as DedicatedWorkerGlobalScope).postMessage({ key, refs });
    return;
  }
  
  // Handle initialization from main thread
  if (type === 'init') {
    initializeCrossRefs(data);
    (self as DedicatedWorkerGlobalScope).postMessage({ type: 'initialized' });
    return;
  }
  
  // Handle cross-reference queries
  if (type === 'query' && ids) {
    await ensureCrossRefsLoaded();
    
    const result: Record<string, string[]> = {};
    ids.forEach((id: string) => {
      result[id] = crossRefsMap?.[id] || crossRefsCache[id] || [];
    });
    
    logger.debug('SW', `📖 Cross-references fetched for ${ids.length} verses, ${Object.keys(result).filter(k => result[k].length > 0).length} have data`);
    (self as DedicatedWorkerGlobalScope).postMessage({ type: 'result', data: result });
    return;
  }
  
  // Legacy support for direct ids array
  if (ids && !type) {
    await ensureCrossRefsLoaded();
    
    const result: Record<string, string[]> = {};
    ids.forEach((id: string) => {
      result[id] = crossRefsMap?.[id] || crossRefsCache[id] || [];
    });
    
    (self as DedicatedWorkerGlobalScope).postMessage(result);
  }
};

export { loadCrossRefs, fetchCrossRefs };