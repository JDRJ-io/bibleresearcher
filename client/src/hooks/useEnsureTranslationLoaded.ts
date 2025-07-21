
import { useEffect, useState } from 'react';

// CLEAN IMPLEMENTATION: Use ONLY BibleDataAPI facade
export function useEnsureTranslationLoaded(translationCode: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const ensureLoaded = async () => {
      if (!translationCode || isLoaded) return;
      
      setIsLoading(true);
      try {
        // Use ONLY BibleDataAPI - single source of truth
        const { loadTranslation } = await import('@/data/BibleDataAPI');
        await loadTranslation(translationCode);
        setIsLoaded(true);
      } catch (error) {
        console.error(`Failed to load translation ${translationCode}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    ensureLoaded();
  }, [translationCode, isLoaded]);

  return { isLoaded, isLoading };
}
