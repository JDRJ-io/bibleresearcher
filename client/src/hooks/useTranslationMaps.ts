import { useState, useRef, useCallback, useEffect } from 'react';
import { masterCache } from '@/lib/supabaseClient';
import { preloadKJV, isKJVReady } from '@/lib/preloader';
import { useTranslationMaps as useTranslationStore } from '@/store/translationSlice';

/**
 * TRANSLATION PIPELINE - MASTER IMPLEMENTATION
 * 
 * Step 1: Parse every .txt file into Map<string,string>, not plain object
 * Step 2: Point Supabase loader at anointed bucket (SUPABASE_BUCKET)
 * Step 3: Off-load parsing to translationWorker.js
 * Step 4: Make useBibleData single source of truth for mainTranslation & activeTranslations
 */

export interface UseTranslationMapsReturn {
  resourceCache: any; // Master cache interface - LRU cache with translations
  activeTranslations: string[];
  mainTranslation: string;
  alternates: string[];
  toggleTranslation: (code: string, setAsMain?: boolean) => Promise<void>;
  removeTranslation: (code: string) => void;
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  getMainVerseText: (verseID: string) => string | undefined;
  setMain: (id: string) => void;
  setAlternates: (ids: string[]) => void;
  isLoading: boolean;
}

// Use master cache from supabaseClient - no local cache needed
// masterCache.get('translation-KJV') instanceof Map → true

export function useTranslationMaps(): UseTranslationMapsReturn {
  // Get persistent translation state from Zustand store
  const translationStore = useTranslationStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Build activeTranslations from store state
  const activeTranslations = [translationStore.main, ...translationStore.alternates];
  const mainTranslation = translationStore.main;
  const alternates = translationStore.alternates;

  // INSTANT ACCESS: Use preloader for immediate display - load user's chosen translation
  useEffect(() => {
    if (mainTranslation === 'KJV') {
      // KJV should already be preloading from module load
      console.log(`⚡ INSTANT: KJV ready status = ${isKJVReady()}`);
      if (!isKJVReady()) {
        preloadKJV().then(() => {
          console.log(`⚡ INSTANT: KJV loaded, triggering re-render`);
        });
      }
    } else {
      // For other translations, load in background
      const loadOtherTranslation = async () => {
        try {
          const { loadTranslation } = await import('@/data/BibleDataAPI');
          const translationMap = await loadTranslation(mainTranslation);
          console.log(`⚡ ${mainTranslation} LOADED: ${translationMap.size} verses from user's stored preference`);
        } catch (error) {
          console.error(`❌ Failed to load ${mainTranslation}:`, error);
        }
      };
      loadOtherTranslation();
    }
  }, [mainTranslation]); // React to changes in main translation

  // Load alternate translations that are in store but missing from cache
  useEffect(() => {
    const loadMissingAlternates = async () => {
      for (const altCode of alternates) {
        if (!masterCache.has(`translation-${altCode}`)) {
          console.log(`🔄 Loading missing alternate translation: ${altCode}`);
          try {
            const { loadTranslation } = await import('@/data/BibleDataAPI');
            const translationMap = await loadTranslation(altCode);
            console.log(`✅ Loaded alternate translation: ${altCode} (${translationMap.size} verses)`);
          } catch (error) {
            console.error(`❌ Failed to load alternate ${altCode}:`, error);
          }
        }
      }
    };
    
    if (alternates.length > 0) {
      loadMissingAlternates();
    }
  }, [alternates]); // React to changes in alternate translations

  // All translation parsing is now handled by BibleDataAPI facade

  /**
   * Toggle a translation ON/OFF
   * If setAsMain=true, places it at index 0 (main translation)
   * Otherwise appends to activeTranslations as alternate
   */
  const toggleTranslation = useCallback(async (code: string, setAsMain = false) => {
    console.log(`🔄 TOGGLE TRANSLATION: ${code}, setAsMain: ${setAsMain}`);
    setIsLoading(true);
    
    try {
      // Check if translation is already in master cache
      if (!masterCache.has(`translation-${code}`)) {
        console.log(`🔄 Fetching translation: ${code}`);
        
        // Use BibleDataAPI for unified data access
        const { loadTranslation } = await import('@/data/BibleDataAPI');
        const translationMap = await loadTranslation(code);
        
        // Task 2.1: Log map size, duration, and Supabase path on every load
        console.log(`✅ Cached translation: ${code} (${translationMap.size} verses)`);
        console.log(`📊 TRANSLATION LOAD: ${code} - ${translationMap.size} verses, from anointed/translations/${code}.txt`);
        console.log(`🔍 VALIDATION: masterCache.get('translation-${code}') instanceof Map → ${masterCache.get(`translation-${code}`) instanceof Map}`);
        
        // Task 2.2: Fail-loud toast if map size === 0
        if (translationMap.size === 0) {
          console.error(`🚨 FAILED TO LOAD: ${code} - map size is 0, check CDN path`);
          // User-visible toast for translation loading failures
          if (typeof window !== 'undefined') {
            import('@/hooks/use-toast').then(({ toast }) => {
              toast({
                title: "FAILED to load " + code,
                description: "Translation file may be missing or corrupted. Check console for details.",
                variant: "destructive",
              });
            });
          }
        }
      } else {
        console.log(`✅ Translation ${code} already cached, skipping duplicate load`);
      }
      
      // Update persistent translation state using Zustand store
      if (setAsMain) {
        // Update the persistent store instead of local state
        translationStore.setMain(code);
        console.log(`🎯 SETTING ${code} AS MAIN via Zustand store`);
      } else {
        // Toggle alternate in the persistent store
        translationStore.toggleAlternate(code);
        console.log(`📋 TOGGLING ${code} AS ALTERNATE via Zustand store`);
      }
      
    } catch (error) {
      console.error('Error toggling translation:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Define toggleTranslation before useEffect
  const toggleTranslationRef = useRef(toggleTranslation);
  toggleTranslationRef.current = toggleTranslation;

  /**
   * Remove translation from activeTranslations
   * Keep in cache to avoid re-download in same session
   */
  const removeTranslation = useCallback((code: string) => {
    // Remove from alternates if present, can't remove main translation
    if (code !== translationStore.main) {
      translationStore.toggleAlternate(code); // This will remove it if it exists
    }
  }, [translationStore]);

  /**
   * Get verse text from specific translation
   * Direct map.get(verseID) lookup - no per-verse fetch
   */
  const getVerseText = useCallback((verseID: string, translationCode: string): string | undefined => {
    const translationMap = masterCache.get(`translation-${translationCode}`);
    if (!translationMap) return undefined;
    
    // OPTIMIZATION: verseID is now in dot format - direct lookup
    return translationMap.get(verseID);
  }, []);

  /**
   * Get verse text from main translation (index 0)
   * Used by cross-references, prophecy, dates - always main translation
   */
  const getMainVerseText = useCallback((verseID: string): string | undefined => {
    const mainTranslationMap = masterCache.get(`translation-${mainTranslation}`);
    if (!mainTranslationMap) return undefined;
    
    // OPTIMIZATION: verseID is now in dot format - direct lookup
    return mainTranslationMap.get(verseID);
  }, [mainTranslation]);

  /**
   * Set main translation - convenience function that uses the Zustand store
   */
  const setMain = useCallback((id: string) => {
    translationStore.setMain(id);
  }, [translationStore]);

  /**
   * Set alternates array - convenience function that uses the Zustand store
   */
  const setAlternates = useCallback((ids: string[]) => {
    // First clear all alternates, then add the new ones
    const currentAlts = [...translationStore.alternates];
    currentAlts.forEach(alt => translationStore.toggleAlternate(alt));
    ids.forEach(id => translationStore.toggleAlternate(id));
  }, [translationStore]);

  return {
    resourceCache: masterCache,
    activeTranslations,
    mainTranslation,
    alternates,
    toggleTranslation,
    removeTranslation,
    getVerseText,
    getMainVerseText,
    setMain,
    setAlternates,
    isLoading
  };
}