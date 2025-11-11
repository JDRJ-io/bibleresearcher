import { useEffect, useRef, useState } from 'react';

interface TranslationWorkerState {
  isReady: boolean;
  loadingTranslations: Set<string>;
  loadedTranslations: Map<string, Map<string, string>>;
  progress: number;
}

export function useTranslationWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<TranslationWorkerState>({
    isReady: false,
    loadingTranslations: new Set(),
    loadedTranslations: new Map(),
    progress: 0
  });

  useEffect(() => {
    // Initialize worker
    const worker = new Worker('/translationWorker.js');
    workerRef.current = worker;

    // Initialize with API key from environment variables
    const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseAnon) {
      console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
      return;
    }
    
    worker.postMessage({
      type: 'INIT',
      payload: {
        apiKey: supabaseAnon
      }
    });

    // Handle messages
    worker.onmessage = (e) => {
      const { type, payload } = e.data;

      switch (type) {
        case 'INIT_COMPLETE':
          setState(prev => ({ ...prev, isReady: true }));
          break;

        case 'TRANSLATION_LOADED':
          // Convert verses array to Map
          const textMap = new Map<string, string>();
          payload.verses.forEach((verse: any) => {
            // OPTIMIZATION: Store only in dot format 
            textMap.set(verse.ref, verse.text);
          });

          setState(prev => {
            const newLoaded = new Map(prev.loadedTranslations);
            newLoaded.set(payload.translationId, textMap);
            
            const newLoading = new Set(prev.loadingTranslations);
            newLoading.delete(payload.translationId);
            
            return {
              ...prev,
              loadedTranslations: newLoaded,
              loadingTranslations: newLoading
            };
          });
          
          console.log(`Translation ${payload.translationId} loaded with ${payload.count} verses`);
          
          // Signal that translation loading completed - headers need to recalculate
          window.dispatchEvent(new CustomEvent('translation-layout-change', {
            detail: { translationId: payload.translationId, verseCount: payload.count }
          }));
          break;

        case 'TRANSLATION_ERROR':
          console.error(`Failed to load ${payload.translationId}:`, payload.error);
          setState(prev => {
            const newLoading = new Set(prev.loadingTranslations);
            newLoading.delete(payload.translationId);
            return { ...prev, loadingTranslations: newLoading };
          });
          break;

        case 'PROGRESS':
          setState(prev => ({ ...prev, progress: payload.percentage }));
          break;
      }
    };

    return () => {
      worker.terminate();
    };
  }, []);

  const loadTranslation = (translationId: string) => {
    if (!workerRef.current || !state.isReady) return;
    
    // Skip if already loaded or loading
    if (state.loadedTranslations.has(translationId) || state.loadingTranslations.has(translationId)) {
      return;
    }

    setState(prev => ({
      ...prev,
      loadingTranslations: new Set(Array.from(prev.loadingTranslations).concat(translationId))
    }));

    workerRef.current.postMessage({
      type: 'LOAD_TRANSLATION',
      payload: { translationId }
    });
  };

  const loadMultipleTranslations = (translationIds: string[]) => {
    if (!workerRef.current || !state.isReady) return;

    const toLoad = translationIds.filter(id => 
      !state.loadedTranslations.has(id) && !state.loadingTranslations.has(id)
    );

    if (toLoad.length === 0) return;

    setState(prev => ({
      ...prev,
      loadingTranslations: new Set(Array.from(prev.loadingTranslations).concat(...toLoad))
    }));

    workerRef.current.postMessage({
      type: 'LOAD_MULTIPLE',
      payload: { translationIds: toLoad }
    });
  };

  return {
    isReady: state.isReady,
    loadingTranslations: state.loadingTranslations,
    loadedTranslations: state.loadedTranslations,
    progress: state.progress,
    loadTranslation,
    loadMultipleTranslations
  };
}