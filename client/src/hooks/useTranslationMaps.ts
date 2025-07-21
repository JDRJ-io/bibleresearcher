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
  // GUEST MODE: Force default columns without persistence - only KJV for guests
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
      
      // Update activeTranslations array - avoid duplicates with Array.from(new Set())
      setActiveTranslations(prev => {
        const isActive = prev.includes(code);
        console.log(`📋 Current translations: [${prev.join(', ')}], ${code} is active: ${isActive}`);
        
        if (isActive && !setAsMain) {
          // Toggle OFF - remove from active but keep in cache
          const newTranslations = prev.filter(t => t !== code);
          console.log(`🔴 REMOVING ${code}: [${newTranslations.join(', ')}]`);
          return newTranslations;
        } else {
          // Toggle ON or set as main
          let newTranslations;
          if (setAsMain) {
            // Place at index 0 (main translation)
            newTranslations = Array.from(new Set([code, ...prev.filter(t => t !== code)]));
            console.log(`🎯 SETTING ${code} AS MAIN: [${newTranslations.join(', ')}]`);
          } else {
            // Append as alternate
            newTranslations = Array.from(new Set([...prev, code]));
            console.log(`➕ ADDING ${code} AS ALTERNATE: [${newTranslations.join(', ')}]`);
          }
          return newTranslations;
        }
      });
      
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
    setActiveTranslations(prev => prev.filter(t => t !== code));
  }, []);

  /**
   * Get verse text from specific translation - FIXED: Enhanced format matching
   */
  const getVerseText = useCallback((verseID: string, translationCode: string): string | undefined => {
    const cacheKey = `translation-${translationCode}`;
    const translationMap = masterCache.get(cacheKey);
    
    if (translationMap instanceof Map) {
      // Try multiple reference formats for compatibility
      const formats = [
        verseID,                                  // Exact as-is: "Gen 1:1"
        verseID.replace(/\s+/g, '.'),            // Convert spaces to dots: "Gen.1:1" 
        verseID.replace(/\./g, ' '),             // Convert dots to spaces: "Gen 1:1"
        verseID.replace(/(\w+)\s(\d+):(\d+)/, '$1.$2:$3') // "Gen 1:1" -> "Gen.1:1"
      ];
      
      for (const format of formats) {
        const text = translationMap.get(format);
        if (text) {
          console.log(`✅ Found verse text: ${verseID} -> ${format} in ${translationCode}`);
          return text;
        }
      }
      
      console.warn(`❌ Verse text not found: ${verseID} in ${translationCode} (map size: ${translationMap.size})`);
      console.log(`🔍 First 5 keys in ${translationCode}:`, Array.from(translationMap.keys()).slice(0, 5));
    } else {
      console.warn(`❌ Translation ${translationCode} not loaded or not a Map:`, typeof translationMap);
    }
    
    return undefined;
  }, []);

  /**
   * Get verse text from main translation (index 0)
   * Used by cross-references, prophecy, dates - always main translation
   */
  const getMainVerseText = useCallback((verseID: string): string | undefined => {
    const mainTranslationMap = masterCache.get(`translation-${mainTranslation}`);
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