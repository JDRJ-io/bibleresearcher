
import { createClient } from '@supabase/supabase-js';

export type LabelName = 'who' | 'what' | 'when' | 'where' | 'command' | 'action' | 'why' | 'seed' | 'harvest' | 'prediction';
export type LabelEntry = Record<LabelName, string[]>;
export type LabelMap = Record<string, LabelEntry>; // verseKey -> labels

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// In-memory cache for labels by translation
const labelCache: Record<string, LabelMap> = {};

export async function ensureLabelCacheLoaded(translationCode: string): Promise<void> {
  if (labelCache[translationCode]) {
    console.log(`✅ Labels for ${translationCode} already cached with ${Object.keys(labelCache[translationCode]).length} verses`);
    return; // Already loaded
  }

  console.log(`📚 Loading labels for translation: ${translationCode} from anointed/labels/${translationCode}/ALL.json`);
  
  try {
    const { data, error } = await supabase
      .storage
      .from('anointed')
      .download(`labels/${translationCode}/ALL.json`);
    
    if (error) {
      console.error(`❌ Failed to load labels for ${translationCode}:`, error);
      throw error;
    }

    const json = await data.text();
    const parsedLabels = JSON.parse(json) as LabelMap;
    labelCache[translationCode] = parsedLabels;
    
    console.log(`✅ Loaded labels for ${translationCode} with ${Object.keys(parsedLabels).length} verses`);
    
    // Log a sample of the loaded data for debugging
    const sampleKeys = Object.keys(parsedLabels).slice(0, 3);
    console.log(`🔍 Sample label keys for ${translationCode}:`, sampleKeys);
    if (sampleKeys.length > 0) {
      console.log(`🔍 Sample labels for ${sampleKeys[0]}:`, parsedLabels[sampleKeys[0]]);
    }
  } catch (error) {
    console.error(`❌ Error loading labels for ${translationCode}:`, error);
    // Set empty cache to prevent repeated failed requests
    labelCache[translationCode] = {};
    throw error;
  }
}

export function getLabel(translationCode: string, verseKey: string, labelName: LabelName | null): string[] {
  if (!labelName) return [];
  
  const translationLabels = labelCache[translationCode];
  if (!translationLabels) {
    console.warn(`⚠️ No labels cache found for translation: ${translationCode}`);
    return [];
  }
  
  // Try multiple verse key formats for better matching
  const possibleKeys = [
    verseKey,
    verseKey.replace(/\s/g, '.'), // "Gen 1:1" -> "Gen.1:1"
    verseKey.replace(/\./g, ' '), // "Gen.1:1" -> "Gen 1:1"
  ];
  
  for (const key of possibleKeys) {
    const verseLabels = translationLabels[key];
    if (verseLabels && verseLabels[labelName]) {
      const labels = verseLabels[labelName] || [];
      if (labels.length > 0) {
        console.log(`🏷️ Found ${labels.length} ${labelName} labels for ${key} in ${translationCode}:`, labels);
      }
      return labels;
    }
  }
  
  // Debug: log when no labels are found
  console.log(`🔍 No ${labelName} labels found for ${verseKey} in ${translationCode}. Cache has ${Object.keys(translationLabels).length} verses.`);
  
  return [];
}

export function isLabelCacheReady(translationCode: string): boolean {
  return !!labelCache[translationCode];
}

export function clearLabelCache(): void {
  Object.keys(labelCache).forEach(key => delete labelCache[key]);
}
