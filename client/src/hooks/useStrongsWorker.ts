import { useEffect, useRef, useState } from 'react';
import { getStrongsOffsets } from '@/data/BibleDataAPI';

interface StrongsWorkerData {
  verseKey: string;
  words: Array<{
    original: string;
    transliteration: string;
    strongs: string;
    definition: string;
    pronunciation: string;
  }>;
}

interface StrongsWorkerHook {
  getVerseStrongsData: (verseKey: string) => Promise<StrongsWorkerData>;
  getLemmaVerses: (strongsId: string) => Promise<string[]>;
  isReady: boolean;
}

export function useStrongsWorker(): StrongsWorkerHook {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const pendingRequests = useRef(new Map<string, (data: any) => void>());

  useEffect(() => {
    // Initialize the Strong's worker
    const initWorker = async () => {
      try {
        console.log('🔧 Initializing Strong\'s worker...');
        // Create worker from the public directory
        workerRef.current = new Worker('/strongsWorker.js');
        
        workerRef.current.onerror = (error) => {
          console.error('❌ Strong\'s worker error:', error);
          setIsReady(false);
        };
        
        // Set up message handler
        workerRef.current.onmessage = (event) => {
          const { type, verseKey, strongsId, data } = event.data;
          
          switch (type) {
            case 'INIT_SUCCESS':
              setIsReady(true);
              console.log('✅ Strong\'s worker initialized');
              break;
              
            case 'VERSE_RESULT':
              const verseResolver = pendingRequests.current.get(`verse-${verseKey}`);
              if (verseResolver) {
                verseResolver(data);
                pendingRequests.current.delete(`verse-${verseKey}`);
              }
              break;
              
            case 'LEMMA_RESULT':
              const lemmaResolver = pendingRequests.current.get(`lemma-${strongsId}`);
              if (lemmaResolver) {
                lemmaResolver(data);
                pendingRequests.current.delete(`lemma-${strongsId}`);
              }
              break;
              
            case 'ERROR':
              console.error('Strong\'s worker error:', event.data.message);
              break;
          }
        };

        // Load and send offset data to worker
        console.log('📊 Loading Strong\'s offsets...');
        const offsetsData = await getStrongsOffsets();
        console.log('📤 Sending init message to Strong\'s worker...');
        workerRef.current.postMessage({
          type: 'INIT',
          offsetsData
        });

      } catch (error) {
        console.error('❌ Failed to initialize Strong\'s worker:', error);
        setIsReady(false);
      }
    };

    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const getVerseStrongsData = (verseKey: string): Promise<StrongsWorkerData> => {
    return new Promise((resolve) => {
      if (!workerRef.current || !isReady) {
        resolve({ verseKey, words: [] });
        return;
      }

      pendingRequests.current.set(`verse-${verseKey}`, resolve);
      workerRef.current.postMessage({
        type: 'VERSE',
        verseKey
      });
    });
  };

  const getLemmaVerses = (strongsId: string): Promise<string[]> => {
    return new Promise((resolve) => {
      if (!workerRef.current || !isReady) {
        resolve([]);
        return;
      }

      pendingRequests.current.set(`lemma-${strongsId}`, resolve);
      workerRef.current.postMessage({
        type: 'LEMMA',
        strongsId
      });
    });
  };

  return {
    getVerseStrongsData,
    getLemmaVerses,
    isReady
  };
}