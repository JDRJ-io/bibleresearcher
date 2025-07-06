import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * CORE TRANSLATION SYSTEM IMPLEMENTATION
 * 
 * Core idea: verseKeys gives you the ordered IDs. Translation maps give you the strings.
 * The UI only ever handles IDs; workers and caches handle the strings.
 */

export interface TranslationMap {
  [verseID: string]: string;
}

export interface UseTranslationMapsReturn {
  resourceCache: Map<string, TranslationMap>;
  activeTranslations: string[];
  mainTranslation: string;
  toggleTranslation: (code: string, setAsMain?: boolean) => Promise<void>;
  removeTranslation: (code: string) => void;
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  getMainVerseText: (verseID: string) => string | undefined;
  isLoading: boolean;
}

export function useTranslationMaps(): UseTranslationMapsReturn {
  // resourceCache stores Map<verseID,text> for each translation, fetched once per session
  const resourceCache = useRef<Map<string, TranslationMap>>(new Map());
  
  // activeTranslations array: index 0 = main translation, others are alternates
  const [activeTranslations, setActiveTranslations] = useState<string[]>(['KJV']);
  const [isLoading, setIsLoading] = useState(false);
  
  const mainTranslation = activeTranslations[0] || 'KJV';

  /**
   * Parse translation file into Map<verseID, text>
   * Format: "Gen.1:1 #In the beginning God created..."
   */
  const parseTranslationFile = useCallback((content: string): TranslationMap => {
    const map: TranslationMap = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        const hashIndex = line.indexOf('#');
        if (hashIndex > 0) {
          const verseID = line.substring(0, hashIndex).trim();
          const text = line.substring(hashIndex + 1).trim();
          map[verseID] = text;
        }
      }
    }
    
    console.log(`✓ Parsed translation map with ${Object.keys(map).length} verses`);
    return map;
  }, []);

  /**
   * Fetch and cache translation file
   * Always fetches entire 4MB file, parses into map, stores in resourceCache
   */
  const fetchTranslationFile = useCallback(async (code: string): Promise<TranslationMap> => {
    console.log(`🔄 Fetching translation file: ${code}.txt`);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.storage
        .from('translations')
        .download(`${code}.txt`);
      
      if (error) throw error;
      
      const content = await data.text();
      const translationMap = parseTranslationFile(content);
      
      // Store in resourceCache - one fetch per session
      resourceCache.current.set(code, translationMap);
      console.log(`✅ Translation ${code} cached with ${Object.keys(translationMap).length} verses`);
      
      return translationMap;
    } catch (error) {
      console.error(`❌ Failed to fetch translation ${code}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [parseTranslationFile]);

  /**
   * Toggle translation ON/OFF with main translation promotion
   * User toggles a language ON:
   * • Check resourceCache for its file-code key
   * • If absent, request the entire 4MB translations/{CODE}.txt
   * • Parse off-thread into Map<verseID,text> and store in resourceCache
   * • Push file-code onto activeTranslations (top if "Set as Main", otherwise append)
   */
  const toggleTranslation = useCallback(async (code: string, setAsMain = false) => {
    console.log(`🔄 Toggle translation: ${code}, setAsMain: ${setAsMain}`);
    
    // Check if already active
    const isActive = activeTranslations.includes(code);
    
    if (isActive && !setAsMain) {
      // Remove from active translations but keep in cache
      console.log(`➖ Removing ${code} from active translations`);
      setActiveTranslations(prev => prev.filter(t => t !== code));
      return;
    }
    
    // Ensure translation is cached
    if (!resourceCache.current.has(code)) {
      await fetchTranslationFile(code);
    }
    
    // Add to active translations
    setActiveTranslations(prev => {
      let newActive = prev.filter(t => t !== code); // Remove if already present
      
      if (setAsMain) {
        // Put at index 0 (main translation)
        newActive = [code, ...newActive];
        console.log(`👑 Set ${code} as main translation`);
      } else {
        // Append as alternate
        newActive = [...newActive, code];
        console.log(`➕ Added ${code} as alternate translation`);
      }
      
      console.log(`📋 Active translations: ${newActive.join(', ')} (main: ${newActive[0]})`);
      return newActive;
    });
  }, [activeTranslations, fetchTranslationFile]);

  /**
   * Remove translation from active list (keep in cache)
   * User toggles a language OFF:
   * • Remove its file-code from activeTranslations
   * • Keep its map in resourceCache to avoid another download in same session
   */
  const removeTranslation = useCallback((code: string) => {
    console.log(`➖ Removing translation: ${code}`);
    setActiveTranslations(prev => {
      const newActive = prev.filter(t => t !== code);
      console.log(`📋 Active translations after removal: ${newActive.join(', ')}`);
      return newActive;
    });
  }, []);

  /**
   * Get verse text from specific translation map
   * Direct map.get(id) - no per-verse fetch ever occurs
   */
  const getVerseText = useCallback((verseID: string, translationCode: string): string | undefined => {
    const translationMap = resourceCache.current.get(translationCode);
    return translationMap?.get?.(verseID);
  }, []);

  /**
   * Get verse text from main translation (index 0)
   * Cross-ref & prophecy lookups: always read from main translation map at index 0
   */
  const getMainVerseText = useCallback((verseID: string): string | undefined => {
    const mainCode = activeTranslations[0];
    if (!mainCode) return undefined;
    
    const translationMap = resourceCache.current.get(mainCode);
    return translationMap?.get?.(verseID);
  }, [activeTranslations]);

  return {
    resourceCache: resourceCache.current,
    activeTranslations,
    mainTranslation,
    toggleTranslation,
    removeTranslation,
    getVerseText,
    getMainVerseText,
    isLoading
  };
}