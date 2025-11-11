import { useEffect, useRef, useMemo } from 'react';
import { useBibleStore } from '@/App';
import { batchLoadVerses } from '@/lib/translationLoader';
import { crossRefCacheManager } from '@/lib/crossRefCacheManager';
import { logger } from '@/lib/logger';
import { verseCache } from '@/hooks/data/verseCache';
import { getVerseIndex } from '@/lib/verseIndexMap';
import { debounce, createArrayToken } from '@/utils/timing';

export function useCrossRefTextPrefetcher(
  verseKeys: string[],
  mainTranslation: string,
  velocity: number = 0
) {
  const crossRefsStore = useBibleStore(s => s.crossRefs);
  const loadedVersesRef = useRef(new Map<string, Set<string>>());
  
  // PERF FIX: Use stable token instead of raw array in dependencies
  const verseKeysToken = useMemo(() => createArrayToken(verseKeys), [
    verseKeys.length,
    verseKeys[0],
    verseKeys[verseKeys.length - 1]
  ]);
  
  // PERF FIX: Increase debounce from 100ms to 500ms to reduce load frequency
  // Store the latest load function in a ref to avoid stale closures
  const prefetchFnRef = useRef<() => Promise<void>>();
  const debouncedPrefetchRef = useRef<() => void>();
  
  useEffect(() => {
    const prefetchCrossRefTexts = async () => {
      if (verseKeys.length === 0 || !mainTranslation) return;
      
      // PERF FIX: Velocity-adaptive window size
      // Fast scroll (velocity > 5): small window (8 verses = ±4)
      // Slow/idle: larger window (15 verses = ±7.5)
      const isFastScroll = Math.abs(velocity) > 5;
      const windowSize = isFastScroll ? 8 : 15;
      
      const centerIndex = Math.floor(verseKeys.length / 2);
      const start = Math.max(0, centerIndex - Math.floor(windowSize / 2));
      const end = Math.min(verseKeys.length - 1, centerIndex + Math.floor(windowSize / 2));
      const limitedKeys = verseKeys.slice(start, end + 1);
      
      // OPTIMIZED: Only process verses with status='ready' (main text loaded)
      const readyKeys = limitedKeys.filter(key => {
        const index = getVerseIndex(key);
        const entry = verseCache.get(mainTranslation, index);
        return entry?.status === 'ready';
      });
      
      const startTime = performance.now();
      
      const allTargetVerses = new Set<string>();
      const versesToTrack: Array<{ sourceVerse: string; targets: string[] }> = [];
      
      const loadedForTranslation = loadedVersesRef.current.get(mainTranslation) || new Set<string>();
      
      for (const verseKey of readyKeys) {
        const crossRefData = crossRefsStore[verseKey];
        if (!crossRefData?.data || crossRefData.data.length === 0) continue;
        
        const targets: string[] = [];
        for (const ref of crossRefData.data) {
          if (ref.includes('#')) {
            const verses = ref.split('#');
            for (const v of verses) {
              if (!loadedForTranslation.has(v)) {
                allTargetVerses.add(v);
              }
              targets.push(v);
            }
          } else {
            if (!loadedForTranslation.has(ref)) {
              allTargetVerses.add(ref);
            }
            targets.push(ref);
          }
        }
        
        if (targets.length > 0) {
          versesToTrack.push({ sourceVerse: verseKey, targets });
        }
      }
      
      if (allTargetVerses.size === 0) {
        return;
      }
      
      const targetArray = Array.from(allTargetVerses);
      logger.debug('PREFETCH', `Batch loading ${targetArray.length} new cross-ref target verses`, {
        window: `${limitedKeys[0]} to ${limitedKeys[limitedKeys.length - 1]}`,
        windowSize,
        velocity: velocity.toFixed(2),
        isFastScroll,
        readyVerses: readyKeys.length,
        totalVerses: verseKeys.length,
        translation: mainTranslation
      });
      
      try {
        await batchLoadVerses(targetArray, mainTranslation);
        
        const loadedForTranslation = loadedVersesRef.current.get(mainTranslation) || new Set<string>();
        for (const target of targetArray) {
          loadedForTranslation.add(target);
        }
        loadedVersesRef.current.set(mainTranslation, loadedForTranslation);
        
        for (const { sourceVerse, targets } of versesToTrack) {
          crossRefCacheManager.trackCrossRefTexts(sourceVerse, mainTranslation, targets);
        }
        
        const duration = Math.round(performance.now() - startTime);
        logger.info('PREFETCH', `Cross-ref texts loaded successfully`, {
          newTargetVerses: targetArray.length,
          totalLoaded: loadedForTranslation.size,
          sourceVerses: readyKeys.length,
          duration: `${duration}ms`,
          translation: mainTranslation
        });
        
      } catch (error) {
        logger.error('PREFETCH', 'Failed to batch load cross-ref texts:', error);
      }
    };
    
    // Store the latest function so debounced wrapper always calls current version
    prefetchFnRef.current = prefetchCrossRefTexts;
    
    // Create debounced wrapper once that calls through the ref
    if (!debouncedPrefetchRef.current) {
      debouncedPrefetchRef.current = debounce(() => {
        prefetchFnRef.current?.();
      }, 500);
    }
    
    // Call debounced version to reduce load frequency during scroll
    debouncedPrefetchRef.current();
  }, [verseKeysToken, mainTranslation, crossRefsStore, velocity]);
  
  useEffect(() => {
    crossRefCacheManager.updateActiveWindow(verseKeys);
  }, [verseKeys]);
}
