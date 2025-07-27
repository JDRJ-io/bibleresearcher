import { LabelBits } from './labelBits';

export type LabelName = keyof typeof LabelBits;
type SlimEntry = Record<LabelName, string[]>;
type SlimMap = Record<string /*verse*/, Partial<SlimEntry>>;

// Web Worker for off-main-thread processing
const worker = new Worker(new URL('../workers/labels.worker.ts', import.meta.url), { type: 'module' });

// Main thread cache - contains only filtered data for active labels
const cache: Record<string /*tCode*/, SlimMap | undefined> = {};
let pending = new Map<string, Promise<void>>(); // de-dupes concurrent calls

// Normalization functions to handle format mismatches
function normaliseVerseKey(v: string): string {
  // 1) collapse multiple spaces
  const clean = v.trim().replace(/\s+/g, ' ');
  // 2) turn the *first* space (between book & chapter) into a dot
  return clean.replace(' ', '.');
  // "Gen 1:1"  -> "Gen.1:1"
  // "John  3:16" -> "John.3:16"
}
function normaliseLabel(lbl: string): string { 
  return lbl.toLowerCase(); 
}
function normaliseTCode(tc: string): string { 
  return tc.toUpperCase(); 
}

export async function ensureLabelCacheLoaded(
  translationCode: string,
  activeLabels: LabelName[]
): Promise<void> {
  // If no active labels, don't load anything
  if (!activeLabels || activeLabels.length === 0) {
    return;
  }

  // Don't load if already cached
  if (labelsCache[translationCode]) {
    return;
  }

  console.log(`🔍 ensureLabelCacheLoaded: Loading labels for ${translationCode}`);

  try {
    // Request labels loading in worker
    worker.postMessage({
      type: 'LOAD_LABELS',
      translationCode,
      activeLabels
    });

    // Wait for completion via promise
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        const { type, translationCode: tCode, success, error } = event.data;

        if (type === 'LABELS_LOADED' && tCode === translationCode) {
          worker.removeEventListener('message', handleMessage);
          if (success) {
            resolve();
          } else {
            reject(new Error(error));
          }
        }
      };

      worker.addEventListener('message', handleMessage);

      // Timeout after 10 seconds
      setTimeout(() => {
        worker.removeEventListener('message', handleMessage);
        reject(new Error(`Timeout loading labels for ${translationCode}`));
      }, 10000);
    });
  } catch (error) {
    throw error;
  }
}

export function getLabelsForVerses(
  tCodeIn: string,
  verseKeys: string[],
  active: LabelName[]
): SlimMap {
  const tCode = normaliseTCode(tCodeIn);
  const map = cache[tCode] || {};

  console.debug('GLFV input', {
    tCode,
    verseKeys: verseKeys.slice(0, 3),
    active
  });
  console.debug('GLFV cache slice', Object.keys(map).slice(0, 3));

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