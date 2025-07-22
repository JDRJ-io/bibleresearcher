import { useState, useRef, useCallback, useEffect } from 'react';
import { masterCache } from '@/lib/supabaseClient';

/**
 * TRANSLATION PIPELINE - MASTER IMPLEMENTATION
 * 
 * Step 1: Parse every .txt file into Map<string,string>, not plain object
 * Step 2: Point Supabase loader at anointed bucket (VITE_SUPABASE_BUCKET)
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
  // activeTranslations array: index 0 = main translation, others are alternates
  const [activeTranslations, setActiveTranslations] = useState<string[]>(['KJV']);
  const [isLoading, setIsLoading] = useState(false);

  const mainTranslation = activeTranslations[0] || 'KJV';
  const alternates = activeTranslations.slice(1);

  // MEMORY FIX: Guard against duplicate initial load - only ONE translation at startup
  const initialLoadRef = useRef(false);
  useEffect(() => {
    if (initialLoadRef.current) return; // Prevent duplicate loads
    initialLoadRef.current = true;

    const loadInitialMain = async () => {
      const initialMain = mainTranslation;
      if (!masterCache.has(`translation-${initialMain}`)) {
        await toggleTranslationRef.current(initialMain, true);
      }
    };
    loadInitialMain();
  }, []); // Only run once on mount

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
      // Use BibleDataAPI facade to ensure translation is loaded
      const { isTranslationLoaded, loadTranslation } = await import('@/data/BibleDataAPI');

      if (!isTranslationLoaded(code)) {
        console.log(`🔄 Loading translation through BibleDataAPI: ${code}`);
        await loadTranslation(code);
      }

      setActiveTranslations(prev => {
        const filtered = prev.filter(t => t !== code);
        if (setAsMain) {
          return [code, ...filtered];
        } else if (filtered.length === prev.length) {
          // wasn't in the list, add it
          return [...prev, code];
        } else {
          // was in the list, removed
          return filtered;
        }
      });

    } catch (error) {
      console.error(`Error loading translation ${code}:`, error);
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(`Failed to load ${code}: ${error.message}`, 'error');
      }
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
    setActiveTranslations(prev => prev.filter(t => t !== code));
  }, []);

  /**
   * Get verse text from specific translation
   * Direct map.get(verseID) lookup - no per-verse fetch
   */
  const getVerseText = useCallback((verseID: string, translationCode: string): string | undefined => {
    const translationMap = masterCache.get(`translation-${translationCode}`);

    // Debug logging for first few lookups
    if (verseID === "Gen 1:1" || verseID === "Gen.1:1") {
      console.log('🔍 getVerseText DEBUG:', {
        verseID,
        translationCode,
        cacheKey: `translation-${translationCode}`,
        hasMap: !!translationMap,
        mapSize: translationMap?.size,
        cacheKeys: Array.from(masterCache.keys()),
        mapHasVerse: translationMap?.has(verseID),
        mapHasVerseAlt: translationMap?.has(verseID.replace(' ', '.')) || translationMap?.has(verseID.replace('.', ' ')),
        sampleKeys: translationMap ? Array.from(translationMap.keys()).slice(0, 5) : []
      });
    }

    // Try both formats: "Gen 1:1" and "Gen.1:1"
    return translationMap?.get(verseID) || 
           translationMap?.get(verseID.replace(' ', '.')) ||
           translationMap?.get(verseID.replace('.', ' '));
  }, []);

  /**
   * Get verse text from main translation (index 0)
   * Used by cross-references, prophecy, dates - always main translation
   */
  const getMainVerseText = useCallback((verseID: string): string | undefined => {
    const mainTranslationMap = masterCache.get(`translation-${mainTranslation}`);

    // Debug logging for main translation lookups
    if (verseID === "Gen 1:1" || verseID === "Gen.1:1") {
      console.log('🔍 getMainVerseText DEBUG:', {
        verseID,
        mainTranslation,
        cacheKey: `translation-${mainTranslation}`,
        hasMap: !!mainTranslationMap,
        mapSize: mainTranslationMap?.size,
        mapHasVerse: mainTranslationMap?.has(verseID),
        mapHasVerseAlt: mainTranslationMap?.has(verseID.replace(' ', '.')) || mainTranslationMap?.has(verseID.replace('.', ' ')),
      });
    }

    // Try both formats: "Gen 1:1" and "Gen.1:1"
    return mainTranslationMap?.get(verseID) || 
           mainTranslationMap?.get(verseID.replace(' ', '.')) ||
           mainTranslationMap?.get(verseID.replace('.', ' '));
    return mainTranslationMap?.get(verseID);
  }, [mainTranslation]);

  /**
   * Set main translation (moves to index 0)
   */
  const setMain = useCallback((id: string) => {
    setActiveTranslations(prev => [id, ...prev.filter(t => t !== id)]);
  }, []);

  /**
   * Set alternate translations (appends after main)
   */
  const setAlternates = useCallback((ids: string[]) => {
    setActiveTranslations(prev => [prev[0] || 'KJV', ...ids]);
  }, []);

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