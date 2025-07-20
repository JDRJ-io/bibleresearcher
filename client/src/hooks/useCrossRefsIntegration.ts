import { useEffect, useRef } from 'react';
import { useBibleStore } from '@/App';
import { getCrossRefWorker } from '@/lib/workers';

/**
 * Hook to integrate cross-references worker with the Bible store
 * Loads cross-references data for visible verses and populates the store
 */
export function useCrossRefsIntegration(visibleVerseRefs: string[]) {
  const { setBulkCrossRefs, showCrossRefs } = useBibleStore();
  const processedRefs = useRef<Set<string>>(new Set());
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!showCrossRefs || visibleVerseRefs.length === 0) return;

    const loadCrossRefsForVerses = async () => {
      try {
        // Get worker instance
        const worker = await getCrossRefWorker();
        workerRef.current = worker;

        // Filter to new verses that haven't been processed
        const newRefs = visibleVerseRefs.filter(ref => !processedRefs.current.has(ref));
        if (newRefs.length === 0) return;

        console.log(`📖 Loading cross-references for ${newRefs.length} verses...`);

        // Set up worker message handler
        const handleWorkerMessage = (e: MessageEvent) => {
          const { type, data } = e.data;
          
          if (type === 'result' && data) {
            // Populate the Bible store with cross-references data
            setBulkCrossRefs(data);
            
            // Mark these verses as processed
            Object.keys(data).forEach(ref => processedRefs.current.add(ref));
            
            const versesWithRefs = Object.keys(data).filter(k => data[k].length > 0);
            console.log(`✅ Cross-references loaded for ${versesWithRefs.length}/${Object.keys(data).length} verses`);
          }
        };

        worker.onmessage = handleWorkerMessage;

        // Convert verse references to the format expected by the worker
        // (e.g., "Gen 1:1" -> "Gen.1:1")
        const workerRefs = newRefs.map(ref => ref.replace(/\s+/g, '.'));
        
        // Query worker for cross-references
        worker.postMessage({ 
          type: 'query', 
          ids: workerRefs 
        });

      } catch (error) {
        console.error('Failed to load cross-references:', error);
      }
    };

    loadCrossRefsForVerses();

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.onmessage = null;
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