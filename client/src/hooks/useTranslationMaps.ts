import { useState, useEffect, useCallback } from 'react';
import { useTranslationSlice } from '@/store/translationSlice';

// CLEAN IMPLEMENTATION: Use ONLY BibleDataAPI facade
export function useTranslationMaps() {
  const { main, alternates } = useTranslationSlice();
  const [translationMaps, setTranslationMaps] = useState(new Map());

  // Load translation using ONLY BibleDataAPI
  const loadTranslation = useCallback(async (translationCode: string) => {
    try {
      const { loadTranslation: apiLoadTranslation } = await import('@/data/BibleDataAPI');
      const textMap = await apiLoadTranslation(translationCode);
      setTranslationMaps(prev => new Map(prev).set(translationCode, textMap));
      return textMap;
    } catch (error) {
      console.error(`Failed to load translation ${translationCode}:`, error);
      return new Map();
    }
  }, []);

  // Get verse text with proper reference format handling
  const getVerseText = useCallback((reference: string, translationCode: string) => {
    const translationMap = translationMaps.get(translationCode);
    if (!translationMap) return undefined;

    // Try different reference formats
    const formats = [
      reference,
      reference.replace('.', ' '),
      reference.replace(/\s/g, '.'),
      reference.replace(/\./g, ' ')
    ];

    for (const format of formats) {
      if (translationMap.has(format)) {
        return translationMap.get(format);
      }
    }

    return undefined;
  }, [translationMaps]);

  // Load main translation on mount
  useEffect(() => {
    if (main && !translationMaps.has(main)) {
      loadTranslation(main);
    }
  }, [main, loadTranslation, translationMaps]);

  // Load alternate translations
  useEffect(() => {
    alternates.forEach(alt => {
      if (!translationMaps.has(alt)) {
        loadTranslation(alt);
      }
    });
  }, [alternates, loadTranslation, translationMaps]);

  return {
    main,
    alternates,
    getVerseText,
    loadTranslation,
    mainTranslation: main
  };
}