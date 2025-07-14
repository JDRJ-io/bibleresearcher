// 2-A Helper (one place only)
import { useTranslationMaps } from '@/hooks/useTranslationMaps';

export const useEnsureTranslationLoaded = () => {
  const { resourceCache, toggleTranslation } = useTranslationMaps();
  
  return async (id: string) => {
    if (!resourceCache.has(id)) {
      console.log(`🔄 Loading translation ${id} on demand...`);
      await toggleTranslation(id, false); // Load as alternate, not main
    }
  };
};