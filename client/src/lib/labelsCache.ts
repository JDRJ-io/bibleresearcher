import { LabelBits } from './labelBits';

export type LabelName = keyof typeof LabelBits;
type SlimEntry = Record<LabelName, string[]>;
type SlimMap = Record<string /*verse*/, Partial<SlimEntry>>;

// Web Worker for off-main-thread processing
const worker = new Worker(new URL('../workers/labels.worker.ts', import.meta.url), { type: 'module' });

// Main thread cache - contains only filtered data for active labels
const cache: Record<string /*tCode*/, SlimMap | undefined> = {};
let pending = new Map<string, Promise<void>>(); // de-dupes concurrent calls

export function ensureLabelCacheLoaded(
  tCode: string,
  activeLabels: LabelName[]
): Promise<void> {
  console.log(`🔄 WORKER: ensureLabelCacheLoaded called for ${tCode} with labels:`, activeLabels);
  console.log(`🔄 WORKER: Current cache status for ${tCode}:`, !!cache[tCode]);
  
  // Check if we already have all needed labels cached
  if (cache[tCode] && activeLabels.every(l => someVerseHasLabel(cache[tCode]!, l))) {
    console.log(`✅ WORKER: Cache already loaded for ${tCode}, skipping`);
    return Promise.resolve();
  }

  // De-duplicate concurrent requests
  const key = `${tCode}|${activeLabels.sort().join()}`;
  if (pending.has(key)) {
    console.log(`🔄 WORKER: Request already pending for ${key}`);
    return pending.get(key)!;
  }

  console.log(`🔄 WORKER: Starting worker to load ${tCode} labels...`);
  const p = new Promise<void>((resolve) => {
    const handle = (e: MessageEvent) => {
      console.log(`📨 WORKER: Received message from worker:`, e.data);
      if (e.data.tCode !== tCode) return;
      
      // Merge worker results into cache
      cache[tCode] = { ...cache[tCode], ...e.data.filtered };
      console.log(`✅ WORKER: Cache updated for ${tCode}, verse count:`, Object.keys(e.data.filtered || {}).length);
      
      worker.removeEventListener('message', handle);
      pending.delete(key);
      resolve();
    };
    
    worker.addEventListener('message', handle);
    console.log(`📤 WORKER: Posting message to worker:`, { tCode, active: activeLabels });
    worker.postMessage({ tCode, active: activeLabels });
  });

  pending.set(key, p);
  return p;
}

export function getLabelsForVerses(
  tCode: string,
  verseKeys: string[],
  active: LabelName[]
): SlimMap {
  const map = cache[tCode] || {};
  const result: SlimMap = {};
  
  verseKeys.forEach(v => {
    // Try multiple verse key formats for better matching
    const possibleKeys = [
      v,
      v.replace(/\s/g, '.'), // "Gen 1:1" -> "Gen.1:1"
      v.replace(/\./g, ' '), // "Gen.1:1" -> "Gen 1:1"
    ];

    for (const key of possibleKeys) {
      const entry = map[key];
      if (!entry) continue;
      
      const filtered: Partial<SlimEntry> = {};
      active.forEach(lbl => { 
        if (entry[lbl]) filtered[lbl] = entry[lbl]; 
      });
      
      if (Object.keys(filtered).length) {
        result[v] = filtered;
        break; // Found match, stop trying other formats
      }
    }
  });
  
  return result;
}

function someVerseHasLabel(map: SlimMap, lbl: LabelName): boolean {
  return Object.values(map).some(ent => ent[lbl]);
}

// Legacy function for backward compatibility - simplified for new system
export function getLabel(translationCode: string, verseKey: string, labelName: LabelName): string[] {
  const map = cache[translationCode];
  if (!map) return [];
  
  const possibleKeys = [
    verseKey,
    verseKey.replace(/\s/g, '.'), // "Gen 1:1" -> "Gen.1:1"
    verseKey.replace(/\./g, ' '), // "Gen.1:1" -> "Gen 1:1"
  ];

  for (const key of possibleKeys) {
    const entry = map[key];
    if (entry && entry[labelName]) {
      return entry[labelName];
    }
  }

  return [];
}

export function clearLabelCacheForTranslation(translationCode: string): void {
  delete cache[translationCode];
  console.log(`🗑️ Cleared label cache for ${translationCode}`);
}