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
      // Check if translation is already in master cache
      if (!masterCache.has(`translation-${code}`)) {
        console.log(`🔄 Fetching translation: ${code} from Supabase...`);
        
        // Use BibleDataAPI for unified data access
        const { loadTranslation } = await import('@/data/BibleDataAPI');
        const translationMap = await loadTranslation(code);
        
        // Enhanced logging for debugging
        console.log(`✅ Cached translation: ${code} (${translationMap.size} verses)`);
        console.log(`📊 TRANSLATION LOAD: ${code} - ${translationMap.size} verses, from anointed/translations/${code}.txt`);
        console.log(`🔍 VALIDATION: masterCache.get('translation-${code}') instanceof Map → ${masterCache.get(`translation-${code}`) instanceof Map}`);
        
        // Log sample verses for verification
        if (translationMap.size > 0) {
          const sampleEntries = Array.from(translationMap.entries()).slice(0, 3);
          console.log(`📝 Sample verses from ${code}:`, sampleEntries);
        }
        
        // Warn if map size is 0 but don't prevent toggling (empty maps are cached to avoid repeated requests)
        if (translationMap.size === 0) {
          console.warn(`⚠️ Translation ${code} loaded with 0 verses - file may be missing or corrupted`);
        }
      } else {
        const cachedMap = masterCache.get(`translation-${code}`);
        console.log(`✅ Translation ${code} already cached with ${cachedMap?.size || 0} verses, skipping duplicate load`);
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
    
    if (!mainTranslationMap) {
      console.warn(`⚠️ Main translation ${mainTranslation} not found in cache for verse ${verseID}`);
      return undefined;
    }
    
    // Try multiple reference formats to find the verse
    const formats = [
      verseID,                          // Original format
      verseID.replace(' ', '.'),        // "Gen 1:1" → "Gen.1:1"
      verseID.replace('.', ' '),        // "Gen.1:1" → "Gen 1:1"
      verseID.replace(/\s+/g, '.'),     // Handle multiple spaces
      verseID.replace(/\.+/g, ' ')      // Handle multiple dots
    ];
    
    for (const format of formats) {
      const text = mainTranslationMap.get(format);
      if (text) {
        // Debug logging for successful lookups (only for first few)
        if (verseID === "Gen 1:1" || verseID === "Gen.1:1") {
          console.log(`🔍 getMainVerseText SUCCESS: ${verseID} → ${format} in ${mainTranslation}`);
        }
        return text;
      }
    }
    
    // Debug logging for failed lookups
    if (verseID.startsWith("Gen") || verseID.startsWith("Matt")) {
      console.log('🔍 getMainVerseText DEBUG (failed):', {
        verseID,
        mainTranslation,
        cacheKey: `translation-${mainTranslation}`,
        hasMap: !!mainTranslationMap,
        mapSize: mainTranslationMap?.size,
        triedFormats: formats,
        availableKeys: Array.from(mainTranslationMap.keys()).slice(0, 10)
      });
    }
    
    return undefined;
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