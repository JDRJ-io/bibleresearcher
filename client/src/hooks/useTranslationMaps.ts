import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * TRANSLATION PIPELINE - MASTER IMPLEMENTATION
 * 
 * Step 1: Parse every .txt file into Map<string,string>, not plain object
 * Step 2: Point Supabase loader at anointed bucket (VITE_SUPABASE_BUCKET)
 * Step 3: Off-load parsing to translationWorker.js
 * Step 4: Make useBibleData single source of truth for mainTranslation & activeTranslations
 */

export interface UseTranslationMapsReturn {
  resourceCache: Map<string, Map<string, string>>;
  activeTranslations: string[];
  mainTranslation: string;
  toggleTranslation: (code: string, setAsMain?: boolean) => Promise<void>;
  removeTranslation: (code: string) => void;
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  getMainVerseText: (verseID: string) => string | undefined;
  isLoading: boolean;
}

// Global resource cache - persists across component unmounts
// globalResourceCache.get('KJV') instanceof Map → true
const globalResourceCache = new Map<string, Map<string, string>>();

export function useTranslationMaps(): UseTranslationMapsReturn {
  // activeTranslations array: index 0 = main translation, others are alternates
  const [activeTranslations, setActiveTranslations] = useState<string[]>(['KJV']);
  const [isLoading, setIsLoading] = useState(false);
  
  const mainTranslation = activeTranslations[0] || 'KJV';

  // Auto-load KJV translation on first render (moved after toggleTranslation definition)
  useEffect(() => {
    const loadKJV = async () => {
      if (!globalResourceCache.has('KJV')) {
        await toggleTranslationRef.current('KJV', true);
      }
    };
    loadKJV();
  }, []);

  /**
   * Parse translation file into Map<verseID, text>
   * Format: "Gen.1:1 #In the beginning God created..."
   */
  const parseTranslationFile = useCallback((content: string): Map<string, string> => {
    const map = new Map<string, string>();
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        const hashIndex = line.indexOf('#');
        if (hashIndex > 0) {
          const verseID = line.substring(0, hashIndex).trim();
          const text = line.substring(hashIndex + 1).trim();
          map.set(verseID, text);
        }
      }
    }
    
    return map;
  }, []);

  /**
   * Toggle a translation ON/OFF
   * If setAsMain=true, places it at index 0 (main translation)
   * Otherwise appends to activeTranslations as alternate
   */
  const toggleTranslation = useCallback(async (code: string, setAsMain = false) => {
    setIsLoading(true);
    
    try {
      // Check if translation is already in globalResourceCache
      if (!globalResourceCache.has(code)) {
        console.log(`🔄 Fetching translation: ${code}`);
        
        // Point Supabase loader at anointed bucket (Step 2)
        const bucketName = import.meta.env.VITE_SUPABASE_BUCKET || 'anointed';
        const { data, error } = await supabase.storage
          .from(bucketName)
          .download(`translations/${code}.txt`);
          
        if (error) {
          console.error(`Error fetching ${code}:`, error);
          return;
        }
        
        const content = await data.text();
        
        // Parse into Map<verseID, text>
        const translationMap = parseTranslationFile(content);
        
        // Store in globalResourceCache for session persistence
        globalResourceCache.set(code, translationMap);
        console.log(`✅ Cached translation: ${code} (${translationMap.size} verses)`);
      }
      
      // Update activeTranslations array
      setActiveTranslations(prev => {
        const isActive = prev.includes(code);
        
        if (isActive) {
          // Toggle OFF - remove from active but keep in cache
          return prev.filter(t => t !== code);
        } else {
          // Toggle ON
          if (setAsMain) {
            // Place at index 0 (main translation)
            return [code, ...prev.filter(t => t !== code)];
          } else {
            // Append as alternate
            return [...prev, code];
          }
        }
      });
      
    } catch (error) {
      console.error('Error toggling translation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [parseTranslationFile]);

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
    const translationMap = globalResourceCache.get(translationCode);
    return translationMap?.get(verseID);
  }, []);

  /**
   * Get verse text from main translation (index 0)
   * Used by cross-references, prophecy, dates - always main translation
   */
  const getMainVerseText = useCallback((verseID: string): string | undefined => {
    const mainTranslationMap = globalResourceCache.get(mainTranslation);
    return mainTranslationMap?.get(verseID);
  }, [mainTranslation]);

  return {
    resourceCache: globalResourceCache,
    activeTranslations,
    mainTranslation,
    toggleTranslation,
    removeTranslation,
    getVerseText,
    getMainVerseText,
    isLoading
  };
}