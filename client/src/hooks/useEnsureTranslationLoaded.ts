// Translation loading helper that ensures translations are loaded before switching
import { masterCache } from '@/lib/supabaseClient';
import { loadTranslation } from '@/data/BibleDataAPI';

export const useEnsureTranslationLoaded = () => {
  return async (id: string) => {
    const translationKey = `translation-${id}`;
    
    if (!masterCache.has(translationKey)) {
      console.log(`🔄 Loading translation ${id} on demand...`);
      try {
        // Load the translation using BibleDataAPI which handles caching
        const translationMap = await loadTranslation(id);
        console.log(`✅ Translation ${id} loaded with ${translationMap.size} verses`);
        
        // Show toast for loading failures
        if (translationMap.size === 0) {
          console.error(`🚨 FAILED TO LOAD: ${id} - translation file may be missing`);
        }
      } catch (error) {
        console.error(`❌ Failed to load translation ${id}:`, error);
        throw error;
      }
    } else {
      console.log(`✅ Translation ${id} already cached, skipping duplicate load`);
    }
  };
};