import { useEffect, useState } from 'react';

// CLEAN IMPLEMENTATION: Use ONLY BibleDataAPI facade
export function useTranslationWorker() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Workers are handled internally by BibleDataAPI
    // No direct worker management needed
    setIsReady(true);
  }, []);

  const loadTranslation = async (translationCode: string) => {
    // Use ONLY BibleDataAPI - single source of truth
    const { loadTranslation: apiLoadTranslation } = await import('@/data/BibleDataAPI');
    return apiLoadTranslation(translationCode);
  };

  return {
    isReady,
    loadTranslation
  };
}