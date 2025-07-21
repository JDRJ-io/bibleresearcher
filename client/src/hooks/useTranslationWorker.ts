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

    // Initialize with API key
    worker.postMessage({
      type: 'INIT',
      payload: {
        apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYXF2eGJic2N3Y3hianBmcmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTA2MTQsImV4cCI6MjA2MTA2NjYxNH0.yZgEijr7c_oAFu2oYWD4YCmrbusoWL3wgsAi757CCU8'
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
            textMap.set(verse.ref, verse.text);
            // Also store with space format
            textMap.set(verse.ref.replace('.', ' '), verse.text);
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