
import { useEffect, useRef } from 'react';
import { getCrossReferences, getCfOffsets, loadCrossReferences } from '@/data/BibleDataAPI';
import { useBibleStore } from '@/App';

export function useCrossRefLoader(verseKeys: string[], cfSet: 'cf1' | 'cf2' = 'cf1') {
  const { crossRefs: crossRefsStore, setCrossRefs } = useBibleStore();
  const loadingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadCrossRefs = async () => {
      if (verseKeys.length === 0) return;

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
        console.log(`🔄 FAST: Loading cross-references for ${neededVerses.length} verses using offsets`);
        
        // OPTIMIZATION: Load offsets and cross-ref data once for batch processing
        const [cfOffsets, crossRefData] = await Promise.all([
          getCfOffsets(cfSet),
          loadCrossReferences(cfSet)
        ]);

        // FAST BATCH: Process all verses in memory without individual async calls
        const results = neededVerses.map(verseId => {
          try {
            const offset = cfOffsets[verseId];
            if (!offset) {
              return { verseId, refs: [] };
            }

            // Direct string slice - extremely fast
            const targetLine = crossRefData.substring(offset[0], offset[1]).trim();
            if (!targetLine) {
              return { verseId, refs: [] };
            }

            // Parse format: Gen.1:1$$John.1:1#John.1:2#John.1:3$Heb.11:3
            const [, referencesData] = targetLine.split('$$');
            if (!referencesData) return { verseId, refs: [] };

            const allReferences: string[] = [];
            const referenceGroups = referencesData.split('$').filter(group => group.trim());

            referenceGroups.forEach(group => {
              const sequentialRefs = group.split('#').filter(ref => ref.trim());
              sequentialRefs.forEach(ref => {
                const cleanRef = ref.trim();
                if (cleanRef.match(/^[123]?[A-Za-z]+\.\d+:\d+$/)) {
                  allReferences.push(cleanRef);
                }
              });
            });

            return { verseId, refs: allReferences };

          } catch (error) {
            console.warn(`Failed to parse cross-refs for ${verseId}:`, error);
            return { verseId, refs: [] };
          }
        });

        // OPTIMIZATION: Store with original dot format keys
        const updatedCrossRefs: Record<string, string[]> = { ...crossRefsStore };
        results.forEach(({ verseId, refs }) => {
          updatedCrossRefs[verseId] = refs;
          // Remove from loading set
          loadingRef.current.delete(verseId);
        });

        setCrossRefs(updatedCrossRefs);
        console.log(`✅ FAST: Loaded cross-references for ${results.length} verses instantly`);

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
