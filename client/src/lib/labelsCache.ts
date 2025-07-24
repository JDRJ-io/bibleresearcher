
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
  if (labelCache[translationCode]) return; // Already loaded

  console.log(`📚 Loading labels for translation: ${translationCode}`);
  
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
    labelCache[translationCode] = JSON.parse(json) as LabelMap;
    
    console.log(`✅ Loaded labels for ${translationCode} with ${Object.keys(labelCache[translationCode]).length} verses`);
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
  if (!translationLabels) return [];
  
  // Try multiple verse key formats for better matching
  const possibleKeys = [
    verseKey,
    verseKey.replace(/\s/g, '.'), // "Gen 1:1" -> "Gen.1:1"
    verseKey.replace(/\./g, ' '), // "Gen.1:1" -> "Gen 1:1"
  ];
  
  for (const key of possibleKeys) {
    const verseLabels = translationLabels[key];
    if (verseLabels && verseLabels[labelName]) {
      return verseLabels[labelName] || [];
    }
  }
  
  return [];
}

export function isLabelCacheReady(translationCode: string): boolean {
  return !!labelCache[translationCode];
}

export function clearLabelCache(): void {
  Object.keys(labelCache).forEach(key => delete labelCache[key]);
}
