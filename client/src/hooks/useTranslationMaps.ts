import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { masterCache } from '@/lib/supabaseClient';
import { preloadKJV, isKJVReady } from '@/lib/preloader';
import { useTranslationMaps as useTranslationStore } from '@/store/translationSlice';
import { createArrayToken } from '@/utils/timing';

/**
 * TRANSLATION PIPELINE - MASTER IMPLEMENTATION
 * 
 * Step 1: Parse every .txt file into Map<string,string>, not plain object
 * Step 2: Point Supabase loader at anointed bucket (VITE_SUPABASE_BUCKET)
 * Step 3: Off-load parsing to translationWorker.js
 * Step 4: Make useBibleData single source of truth for mainTranslation & activeTranslations
 */

// MODULE-LEVEL SINGLETONS - shared across ALL hook instances to prevent infinite loops
type TrCode = 'KJV' | 'BSB' | 'WEB' | 'YLT';

const loaded = new Set<TrCode>();                      // which translations are fully loaded
const inflight = new Map<TrCode, Promise<void>>();     // single-flight per translation
const bumped = new Set<TrCode>();                      // which ones already bumped the store

/**
 * Ensures a translation is loaded exactly once across all component instances
 * Uses module-level tracking to prevent duplicate loads and version bumps
 */
async function ensureLoaded(code: TrCode, loadTranslationOnce: (c: TrCode) => Promise<any>) {
  // Already loaded - instant return
  if (loaded.has(code)) return;
  
  // Load in progress - await existing promise
  if (inflight.has(code)) return inflight.get(code)!;

  // Start new load - single-flight with robust error handling
  const p = (async () => {
    try {
      await loadTranslationOnce(code);
      loaded.add(code);
    } catch (error) {
      console.error(`⚠️ ensureLoaded failed for ${code}:`, error);
      // Don't add to loaded Set on failure so future retries are possible
      throw error;
    } finally {
      // Always remove from inflight map to allow retries on failure
      inflight.delete(code);
    }
  })();

  inflight.set(code, p);
  return p;
}

export interface UseTranslationMapsReturn {
  resourceCache: any; // Master cache interface - LRU cache with translations
  activeTranslations: string[];
  mainTranslation: string;
  alternates: string[];
  translationsVersion: number; // Reactive counter for triggering re-renders
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

  // SINGLETON MAIN TRANSLATION LOADER - uses module-level tracking to prevent infinite loops
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { loadTranslationOnce } = await import('@/lib/translationLoader');
        
        // Use singleton ensureLoaded - shared across ALL hook instances
        await ensureLoaded(mainTranslation as TrCode, loadTranslationOnce);
        
        if (cancelled) return;

        // Only bump version ONCE per translation (module-level Set prevents duplicates)
        if (!bumped.has(mainTranslation as TrCode)) {
          bumped.add(mainTranslation as TrCode);
          useTranslationStore.getState().incrementTranslationsVersion();
          
          const translationMap = masterCache.get(`translation-${mainTranslation}`);
          const size = translationMap?.size || 0;
          console.log(`⚡ ${mainTranslation} loaded successfully (${size} verses) [ONCE]`);
        }
      } catch (error) {
        console.error(`❌ Failed to load ${mainTranslation}:`, error);
      }
    })();

    return () => { cancelled = true; };
  }, [mainTranslation]);

  // SINGLETON ALTERNATE TRANSLATIONS LOADER - uses module-level tracking
  useEffect(() => {
    if (alternates.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const { loadTranslationOnce } = await import('@/lib/translationLoader');
        const startTime = performance.now();
        
        // Load all alternates in parallel using singleton pattern
        const loadPromises = alternates.map(async (altCode) => {
          try {
            await ensureLoaded(altCode as TrCode, loadTranslationOnce);
            return { success: true, code: altCode };
          } catch (error) {
            console.error(`❌ Failed to load alternate ${altCode}:`, error);
            return { success: false, code: altCode, error };
          }
        });
        
        const results = await Promise.all(loadPromises);
        if (cancelled) return;
        
        // Check which ones need version bumps
        const newlyLoaded = results.filter(r => r.success && !bumped.has(r.code as TrCode));
        
        if (newlyLoaded.length > 0) {
          // Mark all as bumped
          newlyLoaded.forEach(r => bumped.add(r.code as TrCode));
          
          // Bump version once for all new translations
          useTranslationStore.getState().incrementTranslationsVersion();
          
          const duration = performance.now() - startTime;
          const loadedCodes = newlyLoaded.map(r => r.code).join(', ');
          console.log(`✅ Loaded ${newlyLoaded.length} alternate translation${newlyLoaded.length > 1 ? 's' : ''} in ${duration.toFixed(0)}ms: ${loadedCodes} [ONCE]`);
        }
      } catch (error) {
        console.error('Error loading alternates:', error);
      }
    })();

    return () => { cancelled = true; };
  }, [alternates]);

  // All translation parsing is now handled by BibleDataAPI facade

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
        // Use unified translation loader for deduplication
        const { loadTranslationOnce } = await import('@/lib/translationLoader');
        const translationMap = await loadTranslationOnce(code);
        
        // Fail-loud toast if map size === 0
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
        } else {
          // Increment version to trigger cell re-renders
          translationStore.incrementTranslationsVersion();
          console.log(`✅ ${code} loaded successfully (${translationMap.size} verses)`);
        }
      }
      
      // Update persistent translation state using Zustand store
      if (setAsMain) {
        translationStore.setMain(code);
      } else {
        translationStore.toggleAlternate(code);
      }
      
    } catch (error) {
      console.error('Error toggling translation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [translationStore]);

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
    translationsVersion: translationStore.translationsVersion,
    toggleTranslation,
    removeTranslation,
    getVerseText,
    getMainVerseText,
    setMain,
    setAlternates,
    isLoading
  };
}