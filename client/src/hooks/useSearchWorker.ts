import { useEffect, useRef, useState } from 'react';
import type { BibleVerse } from '@/types/bible';

interface SearchResult {
  index: number;
  reference: string;
  matches: Record<string, string>;
}

interface StrongsResult {
  index: number;
  reference: string;
  words: Array<{
    original: string;
    strongs: string;
    transliteration: string;
    definition: string;
  }>;
}

export function useSearchWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [strongsResults, setStrongsResults] = useState<StrongsResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Initialize worker
    const worker = new Worker('/searchWorker.js');
    workerRef.current = worker;

    // Handle messages from worker
    worker.onmessage = (e) => {
      const { type, payload } = e.data;

      switch (type) {
        case 'INIT_COMPLETE':
          setIsReady(true);
          console.log('Search worker initialized');
          break;

        case 'SEARCH_RESULTS':
          setSearchResults(payload.results);
          setIsSearching(false);
          break;

        case 'STRONGS_RESULTS':
          setStrongsResults(payload.results);
          setIsSearching(false);
          break;

        case 'RANDOM_VERSE':
          // Handle random verse navigation
          if (payload.verse) {
            window.dispatchEvent(new CustomEvent('navigateToVerse', {
              detail: { reference: payload.verse.reference }
            }));
          }
          break;

        case 'ERROR':
          console.error('Worker error:', payload.error);
          setIsSearching(false);
          break;
      }
    };

    worker.onerror = (error) => {
      console.error('Worker error:', error);
      setIsSearching(false);
    };

    return () => {
      worker.terminate();
    };
  }, []);

  const initializeData = (verses: BibleVerse[], translations?: Map<string, Map<string, string>>) => {
    if (!workerRef.current) return;

    const translationData = translations ? 
      Array.from(translations.entries()).map(([id, data]) => ({
        id,
        data: Array.from(data.entries())
      })) : [];

    workerRef.current.postMessage({
      type: 'INIT_DATA',
      payload: {
        verses,
        translations: translationData
      }
    });
  };

  const searchText = (query: string, translations: string[], caseSensitive = false) => {
    if (!workerRef.current || !isReady) return;

    setIsSearching(true);
    workerRef.current.postMessage({
      type: 'SEARCH_TEXT',
      payload: { query, translations, caseSensitive }
    });
  };

  const searchStrongs = (strongsNumber: string) => {
    if (!workerRef.current || !isReady) return;

    setIsSearching(true);
    workerRef.current.postMessage({
      type: 'SEARCH_STRONGS',
      payload: { strongsNumber }
    });
  };

  const getRandomVerse = () => {
    if (!workerRef.current || !isReady) return;

    workerRef.current.postMessage({
      type: 'RANDOM_VERSE',
      payload: {}
    });
  };

  return {
    isReady,
    isSearching,
    searchResults,
    strongsResults,
    initializeData,
    searchText,
    searchStrongs,
    getRandomVerse
  };
}

// Direct search function for immediate use without worker
export async function performSearch({ query, translations, allVerses }: {
  query: string;
  translations: string[];
  allVerses: any[];
}): Promise<SearchResult[]> {
  console.log(`Performing direct search for "${query}" across ${translations.length} translations in ${allVerses.length} verses`);
  
  const results: SearchResult[] = [];
  const lowercaseQuery = query.toLowerCase();
  
  // Search through all verses, not just visible ones
  for (let i = 0; i < allVerses.length; i++) {
    const verse = allVerses[i];
    const matches: Record<string, string> = {};
    
    // Search in each active translation
    for (const translationId of translations) {
      const text = verse.text?.[translationId];
      if (text && text.toLowerCase().includes(lowercaseQuery)) {
        // Highlight the match
        const regex = new RegExp(`(${query})`, 'gi');
        matches[translationId] = text.replace(regex, '<mark>$1</mark>');
      }
    }
    
    // If we found matches in any translation, add to results
    if (Object.keys(matches).length > 0) {
      results.push({
        index: i,
        reference: verse.reference,
        matches
      });
    }
  }
  
  console.log(`Found ${results.length} verses containing "${query}"`);
  return results;
}