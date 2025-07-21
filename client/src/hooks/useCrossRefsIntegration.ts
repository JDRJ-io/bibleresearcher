import { useEffect, useRef } from 'react';
import { useBibleStore } from '@/App';
import { getCrossRefWorker } from '@/lib/workers';

/**
 * Hook to integrate cross-references worker with the Bible store
 * Loads cross-references data for visible verses and populates the store
 * 
 * Architecture: Main thread → Worker (initialized) → Query → Store → UI
 */
export function useCrossRefsIntegration(visibleVerseRefs: string[]) {
  const { setBulkCrossRefs, showCrossRefs } = useBibleStore();
  const processedRefs = useRef<Set<string>>(new Set());
  const workerRef = useRef<Worker | null>(null);
  const messageHandlerRef = useRef<((e: MessageEvent) => void) | null>(null);

  useEffect(() => {
    if (!showCrossRefs || visibleVerseRefs.length === 0) return;

    const loadCrossRefsForVerses = async () => {
      try {
        // PERFORMANCE FIX: Ensure main translation loaded BEFORE cross-ref processing
        const { getCrossRefSlice, ensureTranslationLoaded } = await import('@/data/BibleDataAPI');
        const { translationState } = useBibleStore.getState();

        // CRITICAL: Wait for main translation to be ready before processing cross-refs
        if (translationState.main) {
          await ensureTranslationLoaded(translationState.main);
        }

        // Filter to new verses that haven't been processed
        const newRefs = visibleVerseRefs.filter(ref => !processedRefs.current.has(ref));
        if (newRefs.length === 0) return;

        console.log(`📖 Loading cross-references directly for ${newRefs.length} verses (memory optimized)...`);

        // Convert to worker format (Gen 1:1 -> Gen.1:1)
        const verseIDs = newRefs.map(ref => ref.replace(/\s+/g, '.'));

        // Load cross-references directly from main thread (faster than worker)
        const crossRefData = await getCrossRefSlice(verseIDs);

        // Update store with loaded data
        setBulkCrossRefs(crossRefData);

        // Mark verses as processed
        newRefs.forEach(ref => processedRefs.current.add(ref));

        const versesWithRefs = Object.keys(crossRefData).filter(k => crossRefData[k].length > 0);
        console.log(`✅ Cross-references loaded directly for ${versesWithRefs.length}/${Object.keys(crossRefData).length} verses`);

      } catch (error) {
        console.error('Failed to load cross-references from worker:', error);
      }
    };

    loadCrossRefsForVerses();

    // Cleanup function
    return () => {
      if (workerRef.current && messageHandlerRef.current) {
        workerRef.current.removeEventListener('message', messageHandlerRef.current);
        messageHandlerRef.current = null;
      }
    };
  }, [visibleVerseRefs, showCrossRefs, setBulkCrossRefs]);

  // Clear processed refs when cross-refs are toggled off
  useEffect(() => {
    if (!showCrossRefs) {
      processedRefs.current.clear();
    }
  }, [showCrossRefs]);
}