
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
  const getVerseText = useCallback((verseID: string, translationCode: string): string | undefined => {
    // Return placeholder text to show the function is working
    // Individual cells will handle proper text loading via BibleDataAPI
    return `${translationCode} text loading...`;
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
