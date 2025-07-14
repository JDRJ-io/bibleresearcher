import { useCallback } from 'react';
import { ensureTranslation } from '@/lib/translationCache';

export function useEnsureTranslationLoaded() {
  return useCallback(async (translationId: string) => {
    await ensureTranslation(translationId);
  }, []);
}