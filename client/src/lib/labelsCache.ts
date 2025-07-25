import { BibleDataAPI } from '@/data/BibleDataAPI';

export type LabelName = 'who' | 'what' | 'when' | 'where' | 'command' | 'action' | 'why' | 'seed' | 'harvest' | 'prediction';
export type LabelEntry = Record<LabelName, string[]>;
export type LabelMap = Record<string, LabelEntry>; // verseKey -> labels

// In-memory cache for labels by translation
const labelCache: Record<string, LabelMap> = {};

// Track which translations are currently loading to prevent duplicate requests
const loadingTranslations = new Set<string>();

export async function ensureLabelCacheLoaded(translationCode: string): Promise<void> {
  if (labelCache[translationCode]) {
    console.log(`✅ Labels for ${translationCode} already cached with ${Object.keys(labelCache[translationCode]).length} verses`);
    return; // Already loaded
  }

  if (loadingTranslations.has(translationCode)) {
    console.log(`⏳ Labels for ${translationCode} already loading, waiting...`);
    // Wait for the existing load to complete
    while (loadingTranslations.has(translationCode)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  console.log(`📚 Loading labels for translation: ${translationCode} via BibleDataAPI`);

  loadingTranslations.add(translationCode);

  try {
    // Use BibleDataAPI instead of direct Supabase calls
    const parsedLabels = await BibleDataAPI.getLabelsData(translationCode) as LabelMap;
    labelCache[translationCode] = parsedLabels;

    console.log(`✅ Loaded labels for ${translationCode} with ${Object.keys(parsedLabels).length} verses via BibleDataAPI`);

    // Log a sample of the loaded data for debugging
    const sampleKeys = Object.keys(parsedLabels).slice(0, 3);
    console.log(`🔍 Sample label keys for ${translationCode}:`, sampleKeys);
    if (sampleKeys.length > 0) {
      console.log(`🔍 Sample labels for ${sampleKeys[0]}:`, parsedLabels[sampleKeys[0]]);
    }
  } catch (error) {
    console.error(`❌ Error loading labels for ${translationCode} via BibleDataAPI:`, error);
    // Set empty cache to prevent repeated failed requests
    labelCache[translationCode] = {};
    throw error;
  } finally {
    loadingTranslations.delete(translationCode);
  }
}

// Optimized function to get labels only for specific verses and label types
export function getLabelsForVerses(
  translationCode: string, 
  verseKeys: string[], 
  activeLabels: LabelName[]
): Record<string, Record<LabelName, string[]>> {
  const translationLabels = labelCache[translationCode];
  if (!translationLabels || activeLabels.length === 0) {
    return {};
  }

  const result: Record<string, Record<LabelName, string[]>> = {};

  for (const verseKey of verseKeys) {
    // Try multiple verse key formats for better matching
    const possibleKeys = [
      verseKey,
      verseKey.replace(/\s/g, '.'), // "Gen 1:1" -> "Gen.1:1"
      verseKey.replace(/\./g, ' '), // "Gen.1:1" -> "Gen 1:1"
    ];

    for (const key of possibleKeys) {
      const verseLabels = translationLabels[key];
      if (verseLabels) {
        const filteredLabels: Record<LabelName, string[]> = {};

        // Only extract the active label types
        for (const labelName of activeLabels) {
          if (verseLabels[labelName] && verseLabels[labelName].length > 0) {
            filteredLabels[labelName] = verseLabels[labelName];
          }
        }

        if (Object.keys(filteredLabels).length > 0) {
          result[verseKey] = filteredLabels;
        }
        break; // Found match, no need to try other key formats
      }
    }
  }

  return result;
}

// Legacy function for backward compatibility
export function getLabel(translationCode: string, verseKey: string, labelName: LabelName): string[] {
  console.log(`🏷️ getLabel called: translation="${translationCode}", verse="${verseKey}", label="${labelName}"`);

  const translationLabels = labelCache[translationCode];
  if (!translationLabels) {
    console.log(`❌ No translation labels found for "${translationCode}"`);
    console.log(`Available translations in cache:`, Object.keys(labelCache));
    return [];
  }

  // Try multiple verse key formats for better matching
  const possibleKeys = [
    verseKey,
    verseKey.replace(/\s/g, '.'), // "Gen 1:1" -> "Gen.1:1"
    verseKey.replace(/\./g, ' '), // "Gen.1:1" -> "Gen 1:1"
  ];

  console.log(`🔍 Trying keys:`, possibleKeys);

  for (const key of possibleKeys) {
    const verseLabels = translationLabels[key];
    console.log(`🔍 Checking key "${key}":`, verseLabels ? 'found' : 'not found');

    if (verseLabels && verseLabels[labelName]) {
      const result = verseLabels[labelName];
      console.log(`✅ Found labels for "${labelName}":`, result);
      return result;
    }
  }

  // Show what keys are actually available for debugging
  const availableKeys = Object.keys(translationLabels).slice(0, 5);
  console.log(`❌ No labels found. Sample available keys:`, availableKeys);

  return [];
}

export function isLabelCacheReady(translationCode: string): boolean {
  return !!labelCache[translationCode];
}

export function clearLabelCache(): void {
  Object.keys(labelCache).forEach(key => delete labelCache[key]);
}

// Clear cache when translation changes to force reload
export function clearLabelCacheForTranslation(translationCode: string): void {
  if (labelCache[translationCode]) {
    delete labelCache[translationCode];
    console.log(`🗑️ Cleared label cache for ${translationCode}`);
  }
}