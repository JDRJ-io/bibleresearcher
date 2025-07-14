import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase, masterCache } from '@/lib/supabaseClient';

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

  // Expert's fix: Guard against duplicate initial load - only ONE translation at startup
  useEffect(() => {
    const loadInitialMain = async () => {
      const initialMain = mainTranslation;
      if (!masterCache.has(`translation-${initialMain}`)) {
        await toggleTranslationRef.current(initialMain, true);
      }
    };
    loadInitialMain();
  }, []); // Only run once on mount

  /**
   * Parse translation file into Map<verseID, text>
   * Format: "Gen.1:1 #In the beginning God created..."
   */
  /**
   * Parse translation content using Web Worker to keep main thread under 16ms
   */
  const parseTranslationInWorker = useCallback(async (code: string, content: string): Promise<Map<string, string>> => {
    // Fix: Single worker instance - create and terminate properly
    const worker = new Worker('/translationWorker.js');
    
    try {
      return await new Promise((resolve, reject) => {
        const handle = (e: MessageEvent) => {
          if (e.data?.type === 'TRANSLATION_PARSED' && e.data?.payload?.code === code) {
            worker.removeEventListener('message', handle);
            resolve(e.data.payload.map);
          }
        };
        
        worker.addEventListener('message', handle);
        worker.addEventListener('error', reject);
        
        worker.postMessage({
          type: 'PARSE_TRANSLATION',
          payload: { code, content }
        });
      });
    } finally {
      worker.terminate();
    }
  }, []);

  /**
   * Fallback parser for main thread (when worker unavailable)
   */
  const parseTranslationFileMainThread = useCallback((content: string): Map<string, string> => {
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
      // Check if translation is already in master cache
      if (!masterCache.has(`translation-${code}`)) {
        console.log(`🔄 Fetching translation: ${code}`);
        
        // Point Supabase loader at anointed bucket (Step 2)
        const bucketName = import.meta.env.VITE_SUPABASE_BUCKET || 'anointed';
        const { data, error } = await supabase.storage
          .from(bucketName)
          .download(`translations/${code}.txt`);
        
        // Log map size, duration, and Supabase path on every load
        const startTime = performance.now();
          
        if (error) {
          console.error(`🚨 SUPABASE ERROR: ${code} - ${error.message}`);
          console.error(`📍 PATH: ${bucketName}/translations/${code}.txt`);
          return;
        }
        
        const content = await data.text();
        
        // Step 1-C: Off-load parsing to worker (keeps main thread under 16ms)
        let translationMap: Map<string, string>;
        try {
          const map = await parseTranslationInWorker(code, content);
          translationMap = map;
        } catch (error) {
          // Fallback to main thread if worker fails
          console.warn('Worker parsing failed, using main thread:', error);
          const map = parseTranslationFileMainThread(content);
          translationMap = map;
        }
        
        // Fix: Single write to master cache - no race condition
        masterCache.set(`translation-${code}`, translationMap);
        
        // Task 2.1: Log map size, duration, and Supabase path on every load
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        console.log(`✅ Cached translation: ${code} (${translationMap.size} verses)`);
        console.log(`📊 TRANSLATION LOAD: ${code} - ${translationMap.size} verses, ${duration}ms, from ${bucketName}/translations/${code}.txt`);
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
      }
      
      // Update activeTranslations array - avoid duplicates with Array.from(new Set())
      setActiveTranslations(prev => {
        const isActive = prev.includes(code);
        
        if (isActive) {
          // Toggle OFF - remove from active but keep in cache
          return prev.filter(t => t !== code);
        } else {
          // Toggle ON
          if (setAsMain) {
            // Place at index 0 (main translation)
            return Array.from(new Set([code, ...prev.filter(t => t !== code)]));
          } else {
            // Append as alternate
            return Array.from(new Set([...prev, code]));
          }
        }
      });
      
    } catch (error) {
      console.error('Error toggling translation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [parseTranslationFileMainThread, parseTranslationInWorker]);

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
    return translationMap?.get(verseID);
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