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