// 2-A Helper (one place only)
import { useBibleStore } from '@/providers/BibleDataProvider';

export const useEnsureTranslationLoaded = () => {
  const { loadTranslation, getVerseText } = useBibleStore();
  
  return async (translationId: string) => {
    // Check if translation is already loaded
    const testVerse = getVerseText('Gen.1:1', translationId);
    if (!testVerse) {
      // Load the translation
      await loadTranslation(translationId);
    }
  };
};