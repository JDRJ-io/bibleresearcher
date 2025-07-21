// DEPRECATED: This file is deprecated. Use BibleDataAPI.loadTranslation() directly.
// This hook is kept only for backward compatibility but should not be used.

import { useTranslationSlice } from '@/store/translationSlice';

export function useTranslationMaps() {
  const { main, alternates } = useTranslationSlice();

  console.warn('⚠️ useTranslationMaps is deprecated. Use BibleDataAPI.loadTranslation() directly.');

  return {
    main,
    alternates,
    getVerseText: () => undefined,
    loadTranslation: async () => new Map(),
    mainTranslation: main
  };
}