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
        // First ensure the main translation is loaded before querying cross-refs
        const { ensureTranslationLoaded } = await import('@/data/BibleDataAPI');
        await ensureTranslationLoaded('KJV');
        
        // Get worker instance (this triggers initialization with cf1 data from BibleDataAPI)
        const worker = await getCrossRefWorker();
        workerRef.current = worker;

        // Filter to new verses that haven't been processed
        const newRefs = visibleVerseRefs.filter(ref => !processedRefs.current.has(ref));
        if (newRefs.length === 0) return;

        console.log(`📖 Querying cross-references worker for ${newRefs.length} verses...`);

        // Set up worker message handler for this query
        const handleWorkerMessage = (e: MessageEvent) => {
          const { type, data, key, refs } = e.data;
          
          // Handle single verse result from worker
          if (key && refs) {
            setBulkCrossRefs({ [key]: refs });
            processedRefs.current.add(key);
            console.log(`✅ Cross-reference loaded for ${key}: ${refs.length} references`);
            return;
          }
          
          // Handle bulk result from worker
          if (type === 'result' && data) {
            setBulkCrossRefs(data);
            
            // Mark these verses as processed
            Object.keys(data).forEach(ref => processedRefs.current.add(ref));
            
            const versesWithRefs = Object.keys(data).filter(k => data[k].length > 0);
            console.log(`✅ Cross-references bulk loaded for ${versesWithRefs.length}/${Object.keys(data).length} verses`);
          }
        };

        // Clean up previous handler
        if (messageHandlerRef.current) {
          worker.removeEventListener('message', messageHandlerRef.current);
        }
        
        // Set up new handler
        messageHandlerRef.current = handleWorkerMessage;
        worker.addEventListener('message', handleWorkerMessage);

        // Convert verse references to the format expected by the worker
        // (e.g., "Gen 1:1" -> "Gen.1:1") 
        const workerRefs = newRefs.map(ref => ref.replace(/\s+/g, '.'));
        
        // Query worker for cross-references
        worker.postMessage({ 
          type: 'query', 
          ids: workerRefs 
        });

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