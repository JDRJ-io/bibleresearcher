
import { useEffect, useRef, useMemo } from 'react';
import { useBibleStore } from '@/App';
import { logger } from '@/lib/logger';
import { debounce, createArrayToken } from '@/utils/timing';

export function useCrossRefLoader(verseKeys: string[]) {
  const loadCrossRefsData = useBibleStore(s => s.loadCrossRefsData);
  const loadingRef = useRef<Set<string>>(new Set());
  
  // PERF FIX: Use stable token instead of expensive array.join()
  const verseKeysKey = useMemo(() => createArrayToken(verseKeys), [
    verseKeys.length,
    verseKeys[0],
    verseKeys[verseKeys.length - 1]
  ]);

  // PERF FIX: Debounce cross-ref loading to reduce triggers during scroll (300ms)
  // Store the latest load function in a ref to avoid stale closures
  const loadFnRef = useRef<() => Promise<void>>();
  const debouncedLoadRef = useRef<() => void>();
  
  useEffect(() => {
    const loadCrossRefs = async () => {
      const crossRefsStore = useBibleStore.getState().crossRefs;
      
      const loadStartTime = performance.now();
      logger.debug('CROSS-REF', 'request-analysis', {
        totalRequested: verseKeys.length,
        alreadyLoaded: verseKeys.filter(k => crossRefsStore[k]?.data).length,
        currentlyLoading: verseKeys.filter(k => loadingRef.current.has(k)).length,
        timestamp: new Date().toISOString()
      });

      if (verseKeys.length === 0) {
        logger.debug('CROSS-REF', 'no-verses-requested');
        return;
      }

      const neededVerses = verseKeys.filter(verseId => {
        const crossRefStatus = crossRefsStore[verseId];
        return (!crossRefStatus || crossRefStatus.status === 'none' || !crossRefStatus.data) && !loadingRef.current.has(verseId);
      });

      if (neededVerses.length === 0) {
        logger.debug('CROSS-REF', 'already-loaded', {
          totalStoreEntries: Object.keys(crossRefsStore).length,
          requestedVerses: verseKeys.length,
          alreadyHave: verseKeys.filter(k => crossRefsStore[k]?.data).length
        });
        return;
      }

      logger.debug('CROSS-REF', 'batch-start', {
        neededVerses: neededVerses.length,
        totalStoreSize: Object.keys(crossRefsStore).length
      });

      neededVerses.forEach(verseId => {
        loadingRef.current.add(verseId);
      });

      try {
        logger.debug('CROSS-REF', 'two-stage-fetch', {
          verses: neededVerses.length,
          method: 'Two-stage loading (top-5 first) from cf3'
        });
        
        await loadCrossRefsData(neededVerses);
        const loadEndTime = performance.now();
        const loadDuration = Math.round(loadEndTime - loadStartTime);

        neededVerses.forEach(verseId => {
          loadingRef.current.delete(verseId);
        });
        
        const updatedStore = useBibleStore.getState().crossRefs;
        let versesWithRefs = 0;
        let versesWithoutRefs = 0;
        let totalRefsLoaded = 0;
        
        neededVerses.forEach(verseId => {
          const crossRefStatus = updatedStore[verseId];
          if (crossRefStatus?.data && crossRefStatus.data.length > 0) {
            versesWithRefs++;
            totalRefsLoaded += crossRefStatus.data.length;
          } else {
            versesWithoutRefs++;
          }
        });
        
        logger.info('CROSS-REF', 'batch-complete', {
          versesLoaded: neededVerses.length,
          versesWithRefs,
          versesWithoutRefs,
          totalRefsLoaded,
          loadTimeMs: loadDuration,
          status: 'success',
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        const loadEndTime = performance.now();
        const loadDuration = Math.round(loadEndTime - loadStartTime);
        
        logger.error('CROSS-REF', 'batch-failed', {
          versesRequested: neededVerses.length,
          error: error instanceof Error ? error.message : String(error),
          loadTimeMs: loadDuration,
          status: 'failed',
          timestamp: new Date().toISOString()
        });
        
        neededVerses.forEach(verseId => {
          loadingRef.current.delete(verseId);
        });
      }
    };

    // Store the latest function so debounced wrapper always calls current version
    loadFnRef.current = loadCrossRefs;

    // Create debounced wrapper once that calls through the ref
    if (!debouncedLoadRef.current) {
      debouncedLoadRef.current = debounce(() => {
        loadFnRef.current?.();
      }, 300);
    }

    // Call debounced version to reduce load frequency during scroll
    debouncedLoadRef.current();
  }, [verseKeysKey, loadCrossRefsData]);

  // CRITICAL FIX: Listen for translation changes and refresh cross-references
  useEffect(() => {
    const handleTranslationChange = (event: CustomEvent) => {
      logger.info('CROSS-REF', 'translation-changed', {
        from: event.detail.from,
        to: event.detail.to,
        timestamp: event.detail.timestamp
      });
      
      // Force reload cross-references for current verse keys
      if (verseKeys.length > 0) {
        logger.debug('CROSS-REF', 'reloading-for-translation-change', {
          verseCount: verseKeys.length
        });
        
        // Trigger immediate reload by calling the load function
        loadFnRef.current?.();
      }
    };

    window.addEventListener('translation-main-changed', handleTranslationChange as EventListener);
    
    return () => {
      window.removeEventListener('translation-main-changed', handleTranslationChange as EventListener);
    };
  }, [verseKeys.length]); // Re-attach listener when verse keys change
}

/**
 * Ensures full cross-references are loaded for verses that currently have only top-5 cross-references.
 * This function is called when user clicks "Load More" to fetch remaining cross-references.
 * 
 * @param verseKeys Array of verse IDs to ensure full cross-references for
 */
export async function ensureFullCrossRefs(verseKeys: string[]): Promise<void> {
  const { getCrossRefsRemainder } = await import('@/data/BibleDataAPI');

  logger.debug('CROSS-REF', 'expand-request', {
    totalRequested: verseKeys.length,
    timestamp: new Date().toISOString()
  });

  // Get fresh state at the start
  let storeState = useBibleStore.getState();
  
  // Filter to only verses that have 'top5' status (can be expanded)
  const expandableVerses = verseKeys.filter(verseId => {
    const crossRefStatus = storeState.crossRefs[verseId];
    return crossRefStatus && crossRefStatus.status === 'top5';
  });

  if (expandableVerses.length === 0) {
    logger.debug('CROSS-REF', 'expand-skip', {
      totalRequested: verseKeys.length,
      alreadyFull: verseKeys.filter(k => storeState.crossRefs[k]?.status === 'full').length,
      none: verseKeys.filter(k => !storeState.crossRefs[k] || storeState.crossRefs[k]?.status === 'none').length
    });
    return;
  }

  logger.debug('CROSS-REF', 'expand-loading', {
    expandableVerses: expandableVerses.length
  });

  try {
    const loadStartTime = performance.now();
    
    // Load remainder data for all expandable verses in parallel
    const remainderPromises = expandableVerses.map(async (verseId) => {
      try {
        const remainderRefs = await getCrossRefsRemainder(verseId);
        return { verseId, remainderRefs, success: true };
      } catch (error) {
        logger.warn('CROSS-REF', `expand-failed: ${verseId}`, error);
        return { verseId, remainderRefs: [], success: false };
      }
    });
    
    const remainderResults = await Promise.all(remainderPromises);
    const loadEndTime = performance.now();
    const loadDuration = Math.round(loadEndTime - loadStartTime);

    // Merge remainder data with existing top-5 data and update status to 'full'
    let versesExpanded = 0;
    let totalRefsAdded = 0;

    for (const result of remainderResults) {
      if (!result.success) continue;
      
      // Get fresh state for each verse to avoid stale data
      const currentState = useBibleStore.getState();
      const currentStatus = currentState.crossRefs[result.verseId];
      
      if (currentStatus && Array.isArray(currentStatus.data)) {
        // Merge existing top-5 with remainder data
        const fullRefs = [...currentStatus.data, ...result.remainderRefs];
        
        // Update the store with merged data atomically
        useBibleStore.getState().setCrossRefStatus(result.verseId, fullRefs, 'full');
        
        versesExpanded++;
        totalRefsAdded += result.remainderRefs.length;
      }
    }

    logger.info('CROSS-REF', 'expand-complete', {
      versesExpanded,
      totalRefsAdded,
      loadTimeMs: loadDuration,
      status: 'success',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('CROSS-REF', 'expand-error', {
      versesRequested: expandableVerses.length,
      error: error instanceof Error ? error.message : String(error),
      status: 'failed',
      timestamp: new Date().toISOString()
    });
    throw error; // Re-throw so UI can handle the error
  }
}
