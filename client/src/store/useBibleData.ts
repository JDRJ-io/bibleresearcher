import { useBibleStore } from '@/providers/BibleDataProvider';

export const loadTranslationIfNeeded = async (id: string) => {
  const has = useBibleStore.getState().translations[id];
  if (!has) {
    // DELETED: translationLoader - replaced by translationCache.ts
  }
};