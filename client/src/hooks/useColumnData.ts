import { useMemo } from 'react';

export function useColumnData(verseId: string, translationCode: string) {
  return useMemo(async () => {
    try {
      const { getVerseText } = await import('@/data/BibleDataAPI');
      const text = await getVerseText(verseId, translationCode);
      return text || `[${verseId} not found in ${translationCode}]`;
    } catch (error) {
      console.error(`Error getting verse text for ${verseId} in ${translationCode}:`, error);
      return `[Error loading ${translationCode}]`;
    }
  }, [verseId, translationCode]);
}