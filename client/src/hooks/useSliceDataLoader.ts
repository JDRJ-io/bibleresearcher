import { useState, useCallback, useRef } from 'react';

// CLEAN IMPLEMENTATION: Use ONLY BibleDataAPI facade with debounced batching
export function useSliceDataLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingBatch = useRef<{ startIndex: number; endIndex: number } | null>(null);

  // Debounced slice loader with 300-row batching and 50ms delay
  const loadSliceData = useCallback(async (startIndex: number, endIndex: number) => {
    // Expand to 300-row batches for better performance
    const batchSize = 300;
    const batchStart = Math.floor(startIndex / batchSize) * batchSize;
    const batchEnd = Math.ceil(endIndex / batchSize) * batchSize;

    // Store the requested batch
    pendingBatch.current = { startIndex: batchStart, endIndex: batchEnd };

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce for 50ms to batch rapid scroll events
    return new Promise((resolve, reject) => {
      debounceTimer.current = setTimeout(async () => {
        if (!pendingBatch.current) {
          resolve([]);
          return;
        }

        const { startIndex: finalStart, endIndex: finalEnd } = pendingBatch.current;
        setIsLoading(true);
        
        try {
          console.log(`⚡ Loading batched slice: ${finalStart}-${finalEnd} (${finalEnd - finalStart} rows)`);
          
          // Use ONLY BibleDataAPI - no direct slice management
          // BibleDataAPI handles all data slicing internally
          const { loadVerseKeys } = await import('@/data/BibleDataAPI');
          const verseKeys = await loadVerseKeys();
          const result = verseKeys.slice(finalStart, finalEnd);
          
          console.log(`✅ Loaded ${result.length} verse keys in batched slice`);
          resolve(result);
        } catch (error) {
          console.error('Failed to load slice data:', error);
          reject(error);
        } finally {
          setIsLoading(false);
          pendingBatch.current = null;
        }
      }, 50); // 50ms debounce as specified
    });
  }, []);

  return {
    isLoading,
    loadSliceData
  };
}