import { useEffect, useState, useMemo } from 'react';
import { useLoadMode } from '@/contexts/LoadModeContext';
import { ensureLabelCacheLoaded, getLabelsForVerses } from '@/lib/labelsCache';
import type { LabelName } from '@/lib/labelBits';
import type { BibleVerse } from '@/types/bible';
import { useBibleStore } from '@/App';
import { log } from '@/utils/logger';

interface UseViewportLabelsProps {
  verses: BibleVerse[];
  activeLabels: LabelName[];
  mainTranslation: string;
}

export function useViewportLabels({ verses, activeLabels, mainTranslation }: UseViewportLabelsProps) {
  const { mode } = useLoadMode();
  const [isLoading, setIsLoading] = useState(false);
  const [labelsData, setLabelsData] = useState<Record<string, Partial<Record<LabelName, string[]>>>>({});

  // Extract verse keys from verses
  const verseKeys = useMemo(() => 
    verses.map(verse => verse.reference), 
    [verses]
  );

  // Dynamically collect ALL verse references from cross-refs and prophecies in viewport
  const allRequiredVerseKeys = useMemo(() => {
    const store = useBibleStore.getState();
    const allKeys = new Set(verseKeys);

    // Add cross-reference verses from ALL viewport verses
    verseKeys.forEach((verseKey: string) => {
      const crossRefs = store.crossRefs[verseKey] || [];
      crossRefs.forEach((ref: string) => allKeys.add(ref));
    });

    // Add prophecy verses from ALL viewport verses
    verseKeys.forEach((verseKey: string) => {
      const verseRoles = store.prophecyData[verseKey];
      if (verseRoles) {
        const allProphecyIds = [
          ...(verseRoles.P || []),
          ...(verseRoles.F || []),
          ...(verseRoles.V || [])
        ];
        
        allProphecyIds.forEach((prophecyId: any) => {
          const prophecyDetails = store.prophecyIndex[prophecyId];
          if (prophecyDetails) {
            (prophecyDetails.prophecy || []).forEach((ref: string) => allKeys.add(ref));
            (prophecyDetails.fulfillment || []).forEach((ref: string) => allKeys.add(ref));
            (prophecyDetails.verification || []).forEach((ref: string) => allKeys.add(ref));
          }
        });
      }
    });

    const result = Array.from(allKeys);
    const additionalVersesCount = result.length - verseKeys.length;
    // Reduced verbose logging for performance
    if (additionalVersesCount > 0) {
      log.debug('useViewportLabels', () => ({ 
        originalVerses: verseKeys.length,
        expandedVerses: result.length,
        additionalCount: additionalVersesCount
      }));
    }
    
    return result;
  }, [verseKeys.join('|')]);

  // Load labels when translation or active labels change
  useEffect(() => {
    console.log('🔄 WORKER: useViewportLabels effect triggered', { 
      activeLabels, 
      activeLabelsLength: activeLabels.length,
      mainTranslation, 
      verseCount: verses.length,
      allVerseCount: allRequiredVerseKeys.length,
      verseKeysFirst3: verseKeys.slice(0, 3),
      allKeysFirst3: allRequiredVerseKeys.slice(0, 3)
    });

    if (activeLabels.length === 0 || !mainTranslation) {
      console.log('🔄 WORKER: No active labels, clearing data');
      setLabelsData({});
      return;
    }

    const loadLabels = async () => {
      // PERFORMANCE: Skip labels loading during scroll drag for smooth performance
      if (mode === 'KeysOnly') {
        console.log('🎯 LABELS: Skipping labels loading - KeysOnly mode active for smooth scrolling');
        return;
      }

      setIsLoading(true);
      console.log(`🔄 WORKER: Loading labels for ${activeLabels.length} active labels:`, activeLabels, 'translation:', mainTranslation);
      console.log(`🔄 WORKER: Including ${allRequiredVerseKeys.length} total verses (viewport + cross-refs + prophecies)`);
      try {
        // Normalize active labels before passing to worker
        const normActive = activeLabels.map(lbl => lbl.toLowerCase() as LabelName);
        console.log(`🔄 WORKER: About to call ensureLabelCacheLoaded with normalized labels:`, normActive);
        console.log(`🔄 WORKER: Including ${allRequiredVerseKeys.length} specific verses for dynamic loading`);
        await ensureLabelCacheLoaded(mainTranslation, normActive, allRequiredVerseKeys);
        console.log(`✅ WORKER: Cache loaded, getting labels for ${allRequiredVerseKeys.length} verses`);

        // Get labels for ALL required verses (viewport + cross-refs + prophecies)
        const viewportLabels = getLabelsForVerses(mainTranslation, allRequiredVerseKeys, activeLabels);
        setLabelsData(viewportLabels);

        console.log(`🏷️ WORKER: Final viewport labels:`, Object.keys(viewportLabels).length, 'verses with labels out of', allRequiredVerseKeys.length, 'requested');
        
        // Debug: Show some specific examples of loaded labels
        const labeledVerses = Object.keys(viewportLabels).filter(v => Object.keys(viewportLabels[v]).length > 0).slice(0, 3);
        if (labeledVerses.length > 0) {
          console.log(`🏷️ WORKER: Example labeled verses:`, labeledVerses.map(v => ({ 
            verse: v, 
            labelCount: Object.keys(viewportLabels[v]).length,
            labels: Object.keys(viewportLabels[v])
          })));
        }
      } catch (error) {
        console.error('❌ WORKER: Failed to load viewport labels:', error);
        setLabelsData({});
      } finally {
        setIsLoading(false);
      }
    };

    loadLabels();
  }, [activeLabels.join(), mainTranslation, allRequiredVerseKeys.join('|')]); // Use expanded verse list

  // Function to get labels for a specific verse
  const getVerseLabels = (verseReference: string): Partial<Record<LabelName, string[]>> => {
    return labelsData[verseReference] || {};
  };

  return {
    isLoading,
    getVerseLabels,
    hasLabelsData: Object.keys(labelsData).length > 0
  };
}