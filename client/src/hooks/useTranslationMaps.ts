import { useBibleStore } from '@/App';
import { useCallback } from 'react';

/**
 * TRANSLATION MAPS HOOK
 * 
 * Provides translation state and simple sync getVerseText function
 * Note: Complex async loading is handled by individual cells
 */
export function useTranslationMaps() {
  const store = useBibleStore();

  // Simple sync function for backwards compatibility
  const getVerseText = useCallback((verseID: string, translationCode: string): string | undefined => {
    // This is a placeholder - actual text loading happens in individual cells
    // or is provided via the verse object from VirtualBibleTable
    return undefined;
  }, []);

  return {
    main: store.main,
    alternates: store.alternates,
    getVerseText
  };
}