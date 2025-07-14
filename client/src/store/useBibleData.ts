import { useBibleStore } from '@/providers/BibleDataProvider';

export const loadTranslationIfNeeded = async (id: string) => {
  const has = useBibleStore.getState().translations[id];
  if (!has) {
    await translationLoader(id);  // your existing async fetch
  }
};