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
    return; // Already loaded
  }

  if (loadingTranslations.has(translationCode)) {
    // Wait for the existing load to complete
    while (loadingTranslations.has(translationCode)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  loadingTranslations.add(translationCode);

  try {
    // Use BibleDataAPI instead of direct Supabase calls
    const parsedLabels = await BibleDataAPI.getLabelsData(translationCode) as LabelMap;
    labelCache[translationCode] = parsedLabels;
  } catch (error) {
    console.error(`Error loading labels for ${translationCode}:`, error);
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
): Record<string, Partial<Record<LabelName, string[]>>> {
  const translationLabels = labelCache[translationCode];
  if (!translationLabels || activeLabels.length === 0) {
    return {};
  }

  const result: Record<string, Partial<Record<LabelName, string[]>>> = {};

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
        const filteredLabels: Partial<Record<LabelName, string[]>> = {};

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
  const translationLabels = labelCache[translationCode];
  if (!translationLabels) {
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
      return verseLabels[labelName];
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

// Clear cache when translation changes to force reload
export function clearLabelCacheForTranslation(translationCode: string): void {
  if (labelCache[translationCode]) {
    delete labelCache[translationCode];
    console.log(`🗑️ Cleared label cache for ${translationCode}`);
  }
}