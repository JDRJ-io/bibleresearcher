
import { useEffect, useRef } from 'react';
import { getCrossRefsBatch } from '@/data/BibleDataAPI';
import { useLoadMode } from '@/contexts/LoadModeContext';
import { useBibleStore } from '@/App';

export function useCrossRefLoader(verseKeys: string[], cfSet: 'cf1' | 'cf2' = 'cf1') {
  const { mode } = useLoadMode();
  const { crossRefs: crossRefsStore, setCrossRefs } = useBibleStore();
  const loadingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadCrossRefs = async () => {
      if (verseKeys.length === 0) return;

      // PERFORMANCE: Skip cross-refs loading during scroll drag for smooth performance
      if (mode === 'KeysOnly') {
        console.log('🎯 CROSS-REFS: Skipping cross-refs loading - KeysOnly mode active for smooth scrolling');
        return;
      }

      // CENTER-ANCHORED: Only load cross-refs for verses we don't already have
      const neededVerses = verseKeys.filter(verseId => {
        // OPTIMIZATION: verseId is now in dot format - direct lookup
        return !crossRefsStore[verseId] && !loadingRef.current.has(verseId);
      });

      if (neededVerses.length === 0) return;

      // Mark as loading to prevent duplicate requests
      neededVerses.forEach(verseId => {
        // OPTIMIZATION: verseId is now in dot format - direct use
        loadingRef.current.add(verseId);
      });

      try {
        console.log(`🚀 EXPERT RANGE: Batch loading cross-references for ${neededVerses.length} verses with TRUE HTTP Range requests`);
        
        // ULTRA-FAST: Use batch loading with merged range requests
        const batchResults = await getCrossRefsBatch(neededVerses, cfSet);

        // OPTIMIZATION: Store with original dot format keys
        const updatedCrossRefs: Record<string, string[]> = { ...crossRefsStore };
        
        // Add all batch results
        Object.entries(batchResults).forEach(([verseId, refs]) => {
          updatedCrossRefs[verseId] = refs;
          // Remove from loading set
          loadingRef.current.delete(verseId);
        });

        // Also mark any verses that had no results as loaded (empty arrays)
        neededVerses.forEach(verseId => {
          if (!batchResults[verseId]) {
            updatedCrossRefs[verseId] = [];
          }
          loadingRef.current.delete(verseId);
        });

        setCrossRefs(updatedCrossRefs);
        console.log(`✅ EXPERT: Loaded cross-references for ${neededVerses.length} verses using TRUE HTTP Range requests`);

      } catch (error) {
        console.error('Failed to batch load cross-references:', error);
        // Clear loading flags on error
        neededVerses.forEach(verseId => {
          loadingRef.current.delete(verseId);
        });
      }
    };

    loadCrossRefs().catch(console.error);
  }, [verseKeys.join(','), cfSet, crossRefsStore, setCrossRefs]); // Only re-run when verse list changes
}
