import { LabelBits } from './labelBits';

export type LabelName = keyof typeof LabelBits;
type SlimEntry = Record<LabelName, string[]>;
type SlimMap = Record<string /*verse*/, Partial<SlimEntry>>;

// Web Worker for off-main-thread processing
const worker = new Worker(new URL('../workers/labels.worker.ts', import.meta.url), { type: 'module' });

// Main thread cache - contains only filtered data for active labels
const cache: Record<string /*tCode*/, SlimMap | undefined> = {};
let pending = new Map<string, Promise<void>>(); // de-dupes concurrent calls

// STRAIGHT-LINE: Minimal normalization, assume dot format from source
function normaliseVerseKey(v: string): string {
  // Only trim whitespace, trust source format
  return v.trim();
}
function normaliseLabel(lbl: string): string { 
  return lbl.toLowerCase(); 
}
function normaliseTCode(tc: string): string { 
  return tc.toUpperCase(); 
}

export function ensureLabelCacheLoaded(
  tCode: string,
  activeLabels: LabelName[],
  requiredVerses?: string[]
): Promise<void> {
  const normTCode = normaliseTCode(tCode);
  console.log(`🔄 WORKER: ensureLabelCacheLoaded called for ${tCode} (norm: ${normTCode}) with labels:`, activeLabels);
  console.log(`🔄 WORKER: Current cache status for ${normTCode}:`, !!cache[normTCode]);
  
  if (requiredVerses) {
    console.log(`🔄 WORKER: Specific verses requested: ${requiredVerses.length} verses`);
  }

  // Check if we already have all needed labels cached
  if (cache[normTCode] && activeLabels.every(l => someVerseHasLabel(cache[normTCode]!, l))) {
    console.log(`✅ WORKER: Cache already loaded for ${normTCode}, skipping`);
    return Promise.resolve();
  }

  // De-duplicate concurrent requests
  const key = `${normTCode}|${activeLabels.sort().join()}${requiredVerses ? `|${requiredVerses.length}` : ''}`;
  if (pending.has(key)) {
    console.log(`🔄 WORKER: Request already pending for ${key}`);
    return pending.get(key)!;
  }

  console.log(`🔄 WORKER: Starting worker to load ${normTCode} labels...`);
  const p = new Promise<void>((resolve) => {
    const handle = (e: MessageEvent) => {
      console.log(`📨 WORKER: Received message from worker:`, e.data);

      // Skip non-label messages  
      if (e.data.type === 'FETCH_LABELS') {
        console.log(`📨 WORKER: Ignoring FETCH_LABELS request from worker`);
        return;
      }

      const receivedTCode = normaliseTCode(e.data.tCode);
      if (receivedTCode !== normTCode) return;

      // Normalize and merge worker results into cache
      const filtered: SlimMap = {};
      Object.entries(e.data.filtered || {}).forEach(([k, v]) => {
        filtered[normaliseVerseKey(k)] = v as Partial<SlimEntry>;
      });

      cache[normTCode] = { ...(cache[normTCode] || {}), ...filtered };
      console.log(`✅ WORKER: Cache updated for ${normTCode}, verse count:`, Object.keys(filtered).length);

      // Debug: Show example data
      const examples = Object.entries(filtered).slice(0, 3);
      console.log(`🏷️ WORKER: Example label data:`, examples);

      worker.removeEventListener('message', handle);
      pending.delete(key);
      resolve();
    };

    worker.addEventListener('message', handle);
    console.log(`📤 WORKER: Posting message to worker:`, { 
      tCode: normTCode, 
      active: activeLabels, 
      requiredVerses: requiredVerses 
    });
    worker.postMessage({ 
      tCode: normTCode, 
      active: activeLabels, 
      requiredVerses: requiredVerses 
    });
  });

  pending.set(key, p);
  return p;
}

export function getLabelsForVerses(
  tCodeIn: string,
  verseKeys: string[],
  active: LabelName[]
): SlimMap {
  const tCode = normaliseTCode(tCodeIn);
  const map = cache[tCode] || {};

  console.log(`🔍 LABELS: getLabelsForVerses called for ${tCode} with ${verseKeys.length} verses and ${active.length} active labels`);
  console.log(`🔍 LABELS: Cache status for ${tCode}:`, !!cache[tCode]);
  
  const foundCount = verseKeys.filter(vk => !!map[normaliseVerseKey(vk)]).length;
  const missingVerses = verseKeys.filter(vk => !map[normaliseVerseKey(vk)]);
  
  console.log(`🔍 LABELS: Found ${foundCount}/${verseKeys.length} verses in cache`);
  if (missingVerses.length > 0) {
    console.log(`🔍 LABELS: Missing verses from cache:`, missingVerses.slice(0, 10), missingVerses.length > 10 ? `... and ${missingVerses.length - 10} more` : '');
  }

  const out: SlimMap = {};
  verseKeys.forEach(vk => {
    const key = normaliseVerseKey(vk);
    const entry = map[key];
    if (!entry) return;

    const slim: Partial<SlimEntry> = {};
    active.forEach(lbl => {
      const l = normaliseLabel(lbl);
      if (entry[l as LabelName]) {
        slim[l as LabelName] = entry[l as LabelName];
      }
    });
    if (Object.keys(slim).length) {
      out[key] = slim;
    }
  });
  return out;
}

function someVerseHasLabel(map: SlimMap, lbl: LabelName): boolean {
  return Object.values(map).some(ent => ent[lbl]);
}

// Legacy function for backward compatibility - simplified for new system
export function getLabel(translationCode: string, verseKey: string, labelName: LabelName): string[] {
  const normTCode = normaliseTCode(translationCode);
  const map = cache[normTCode];
  if (!map) return [];

  const normKey = normaliseVerseKey(verseKey);
  const normLabel = normaliseLabel(labelName);

  const entry = map[normKey];
  if (entry && entry[normLabel as LabelName]) {
    return entry[normLabel as LabelName] || [];
  }

  return [];
}

export function clearLabelCacheForTranslation(translationCode: string): void {
  const normTCode = normaliseTCode(translationCode);
  delete cache[normTCode];
  console.log(`🗑️ Cleared label cache for ${normTCode}`);
}