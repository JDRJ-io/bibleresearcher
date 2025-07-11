// 2-A Helper (one place only)
import { useBibleStore } from '@/providers/BibleDataProvider';

export const useEnsureTranslationLoaded = () => {
  const { loadTranslation, getVerseText, translations } = useBibleStore();
  
  return async (translationId: string) => {
    // Check if translation is already loaded in the store
    if (translations[translationId]) {
      return; // Already loaded
    }
    
    console.log(`🔄 Loading translation ${translationId} on demand...`);
    
    try {
      // Load the translation
      await loadTranslation(translationId);
      console.log(`✅ Successfully loaded translation ${translationId}`);
    } catch (error) {
      console.error(`❌ Failed to load translation ${translationId}:`, error);
      throw error;
    }
  };
};