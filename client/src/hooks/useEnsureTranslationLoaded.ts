// 2-A Helper (one place only)
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { masterCache } from '@/lib/supabaseClient';

export const useEnsureTranslationLoaded = () => {
  const { toggleTranslation } = useTranslationMaps();
  
  return async (id: string) => {
    // Check master cache using the correct key format
    const translationKey = `translation-${id}`;
    if (!masterCache.has(translationKey)) {
      console.log(`🔄 Loading translation ${id} on demand...`);
      await toggleTranslation(id, false); // Load as alternate, not main
    } else {
      console.log(`✅ Translation ${id} already cached, skipping duplicate load`);
    }
  };
};