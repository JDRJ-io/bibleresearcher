import { useState, useEffect } from 'react';

// CLEAN IMPLEMENTATION: Use ONLY BibleDataAPI facade
export function useSliceDataLoader() {
  const [isLoading, setIsLoading] = useState(false);

  const loadSliceData = async (startIndex: number, endIndex: number) => {
    setIsLoading(true);
    try {
      // Use ONLY BibleDataAPI - no direct slice management
      // BibleDataAPI handles all data slicing internally
      const { loadVerseKeys } = await import('@/data/BibleDataAPI');
      const verseKeys = await loadVerseKeys();
      return verseKeys.slice(startIndex, endIndex);
    } catch (error) {
      console.error('Failed to load slice data:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    loadSliceData
  };
}