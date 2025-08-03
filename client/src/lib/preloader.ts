// PRELOADER - Aggressive translation loading for instant display
import { masterCache } from '@/lib/supabaseBrowser';

// Start loading KJV immediately when module loads (before any component mounts)
let kjvPreloadPromise: Promise<Map<string, string>> | null = null;

export const preloadKJV = () => {
  if (kjvPreloadPromise) return kjvPreloadPromise;
  
  console.log('⚡ PRELOADER: Starting KJV load at module level');
  
  kjvPreloadPromise = (async () => {
    try {
      const { loadTranslation } = await import('@/data/BibleDataAPI');
      const kjvMap = await loadTranslation('KJV');
      console.log(`⚡ PRELOADER: KJV ready with ${kjvMap.size} verses`);
      return kjvMap;
    } catch (error) {
      console.error('⚡ PRELOADER: KJV failed:', error);
      return new Map<string, string>();
    }
  })();
  
  return kjvPreloadPromise;
};

// Check if KJV is ready (for instant access)
export const isKJVReady = (): boolean => {
  return masterCache.has('translation-KJV');
};

// Get KJV text immediately if available
export const getKJVTextInstant = (verseId: string): string => {
  const kjvMap = masterCache.get('translation-KJV') as Map<string, string>;
  return kjvMap?.get(verseId) || '';
};

// Start preloading immediately when this module loads
preloadKJV();