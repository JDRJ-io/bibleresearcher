import { useState, useEffect } from "react";
import type { BibleVerse, Translation } from "@/types/bible";

// CLEAN IMPLEMENTATION: Use ONLY BibleDataAPI facade as per documentation
// Remove all legacy loading methods

export function useBibleData() {
  const [isLoading, setIsLoading] = useState(true);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBibleStructure = async () => {
      try {
        // Use ONLY BibleDataAPI - single source of truth
        const { loadVerseKeys } = await import('@/data/BibleDataAPI');
        const verseKeys = await loadVerseKeys();

        // Convert keys to verse objects
        const verseObjects = verseKeys.map((reference, index) => ({
          id: `${index}`,
          reference,
          book: reference.split(' ')[0],
          chapter: parseInt(reference.split(' ')[1].split(':')[0]),
          verse: parseInt(reference.split(':')[1]),
          text: {} // Text loaded on-demand via BibleDataAPI
        }));

        setVerses(verseObjects);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Bible structure');
        setIsLoading(false);
      }
    };

    loadBibleStructure();
  }, []);

  return {
    isLoading,
    verses,
    error
  };
}