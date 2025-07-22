import { useCallback } from 'react';

export const useEnsureTranslationLoaded = () => {
  return useCallback(async (translationCode: string) => {
    try {
      console.log(`🔄 Ensuring translation loaded: ${translationCode}`);

      // Use BibleDataAPI facade for all translation loading
      const { loadTranslation } = await import('@/data/BibleDataAPI');
      await loadTranslation(translationCode);

      console.log(`✅ Translation ${translationCode} ready`);

    } catch (error) {
      console.error(`❌ Failed to ensure translation ${translationCode} loaded:`, error);
      throw error;
    }
  }, []);
};