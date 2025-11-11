// PRELOADER - Aggressive translation loading for instant display
import { masterCache } from '@/lib/supabaseClient';

// Start loading KJV immediately when module loads (before any component mounts)
let kjvPreloadPromise: Promise<Map<string, string>> | null = null;

export const preloadKJV = () => {
  if (kjvPreloadPromise) return kjvPreloadPromise;
  
  console.log('⚡ PRELOADER: Starting KJV load at module level');
  
  kjvPreloadPromise = (async () => {
    try {
      const { loadTranslationOnce } = await import('@/lib/translationLoader');
      const kjvMap = await loadTranslationOnce('KJV');
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

// PHASE 1.2: Smart KJV preloading based on user preferences
const smartKJVPreload = () => {
  // Use idle callback for better performance
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      // Check if KJV might be needed based on localStorage (user preferences)
      try {
        // Check if user has KJV as main or alternate translation
        const translationState = localStorage.getItem('translation-state');
        if (translationState) {
          const parsed = JSON.parse(translationState);
          const hasKJV = parsed.state?.main === 'KJV' || 
                        (parsed.state?.alternates && parsed.state.alternates.includes('KJV'));
          
          if (hasKJV) {
            console.log('⚡ SMART PRELOADER: KJV detected in user preferences, loading...');
            preloadKJV();
          }
        } else {
          // No saved preferences - KJV is default, so preload it
          console.log('⚡ SMART PRELOADER: No preferences found, preloading default KJV');
          preloadKJV();
        }
      } catch (error) {
        // Fallback: if we can't read preferences, preload KJV as default
        console.log('⚡ SMART PRELOADER: Error reading preferences, preloading default KJV');
        preloadKJV();
      }
    }, { timeout: 2000 });
  } else {
    // Fallback for browsers without idle callback
    setTimeout(() => {
      try {
        const translationState = localStorage.getItem('translation-state');
        if (translationState) {
          const parsed = JSON.parse(translationState);
          const hasKJV = parsed.state?.main === 'KJV' || 
                        (parsed.state?.alternates && parsed.state.alternates.includes('KJV'));
          if (hasKJV) {
            preloadKJV();
          }
        } else {
          preloadKJV(); // Default
        }
      } catch (error) {
        preloadKJV(); // Fallback
      }
    }, 1000);
  }
};

// Start smart preloading
smartKJVPreload();