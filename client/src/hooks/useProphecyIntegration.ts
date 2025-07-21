import { useEffect, useRef } from 'react';
import { useBibleStore } from '@/App';
import { ensureProphecyLoaded, getProphecyForVerse } from '@/lib/prophecyCache';

/**
 * Hook to integrate prophecy data with the Bible store
 * Loads prophecy data for visible verses when showProphecies is enabled
 * 
 * Architecture: Main thread → Cache → Store → UI
 */
export function useProphecyIntegration(visibleVerseRefs: string[]) {
  const { showProphecies, setProphecyData } = useBibleStore();
  const processedRefs = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!showProphecies || visibleVerseRefs.length === 0) return;

    const loadProphecyForVerses = async () => {
      try {
        // Ensure prophecy data is loaded from cache
        await ensureProphecyLoaded();

        // Filter to new verses that haven't been processed
        const newRefs = visibleVerseRefs.filter(ref => !processedRefs.current.has(ref));
        if (newRefs.length === 0) return;

        console.log(`📜 Loading prophecy data for ${newRefs.length} verses...`);

        // Convert to dot format (Gen 1:1 -> Gen.1:1)
        const verseIDs = newRefs.map(ref => ref.replace(/\s+/g, '.'));
        
        // Load prophecy data from cache for these verses
        const prophecyData: Record<string, { P: number[]; F: number[]; V: number[] }> = {};
        verseIDs.forEach(verseID => {
          const data = getProphecyForVerse(verseID);
          if (data.P.length > 0 || data.F.length > 0 || data.V.length > 0) {
            prophecyData[verseID] = data;
          }
        });
        
        // Update store with loaded data
        setProphecyData(prophecyData);
        
        // Mark verses as processed
        newRefs.forEach(ref => processedRefs.current.add(ref));
        
        const versesWithProphecies = Object.keys(prophecyData).length;
        console.log(`✅ Prophecy data loaded for ${versesWithProphecies}/${verseIDs.length} verses`);

      } catch (error) {
        console.error('Failed to load prophecy data:', error);
      }
    };

    loadProphecyForVerses();

  }, [visibleVerseRefs, showProphecies, setProphecyData]);

  // Clear processed refs when prophecies are toggled off
  useEffect(() => {
    if (!showProphecies) {
      processedRefs.current.clear();
    }
  }, [showProphecies]);
}