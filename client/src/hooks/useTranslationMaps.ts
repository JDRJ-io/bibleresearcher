
import { useBibleStore } from '@/App';
import { useCallback } from 'react';

/**
 * TRANSLATION MAPS HOOK
 * 
 * Provides translation state and simple sync getVerseText function
 * Note: Complex async loading is handled by individual cells using BibleDataAPI
 */
export function useTranslationMaps() {
  const store = useBibleStore();

  // Simple sync function for backwards compatibility
  // Actual text loading happens in individual cells via BibleDataAPI
  const getVerseText = useCallback((verseID: string, translationCode: string): string | undefined => {
    // This returns undefined - actual text loading happens in individual cells
    // via BibleDataAPI.loadTranslation() for proper async handling
    return undefined;
  }, []);

  return {
    main: store.main,
    alternates: store.alternates,
    getVerseText,
    setMain: store.setMain,
    toggleAlternate: store.toggleAlternate,
    resetMobileDefaults: store.resetMobileDefaults
  };
}
