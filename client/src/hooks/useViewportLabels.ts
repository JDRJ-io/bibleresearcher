import { useEffect, useState, useMemo } from 'react';
import { ensureLabelCacheLoaded, getLabelsForVerses } from '@/lib/labelsCache';
import type { LabelName } from '@/lib/labelBits';
import type { BibleVerse } from '@/types/bible';
import { useBibleStore } from '@/App';

interface UseViewportLabelsProps {
  verses: BibleVerse[];
  activeLabels: LabelName[];
  mainTranslation: string;
}

export function useViewportLabels({ verses, activeLabels, mainTranslation }: UseViewportLabelsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [labelsData, setLabelsData] = useState<Record<string, Partial<Record<LabelName, string[]>>>>({});

  // Extract verse keys from verses
  const verseKeys = useMemo(() => 
    verses.map(verse => verse.reference), 
    [verses]
  );

  // Also collect cross-reference and prophecy verse keys that appear in the viewport
  const allRequiredVerseKeys = useMemo(() => {
    const store = useBibleStore.getState();
    const allKeys = new Set(verseKeys);

    // Add cross-reference verses
    verseKeys.forEach((verseKey: string) => {
      const crossRefs = store.crossRefs[verseKey] || [];
      crossRefs.forEach((ref: string) => allKeys.add(ref));
    });

    // Add prophecy verses
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
    console.log(`🔄 VIEWPORT: Expanded verse list from ${verseKeys.length} to ${result.length} verses (includes cross-refs and prophecies)`);
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
      setIsLoading(true);
      console.log(`🔄 WORKER: Loading labels for ${activeLabels.length} active labels:`, activeLabels, 'translation:', mainTranslation);
      console.log(`🔄 WORKER: Including ${allRequiredVerseKeys.length} total verses (viewport + cross-refs + prophecies)`);
      try {
        // Normalize active labels before passing to worker
        const normActive = activeLabels.map(lbl => lbl.toLowerCase() as LabelName);
        console.log(`🔄 WORKER: About to call ensureLabelCacheLoaded with normalized labels:`, normActive);
        await ensureLabelCacheLoaded(mainTranslation, normActive);
        console.log(`✅ WORKER: Cache loaded, getting labels for ${allRequiredVerseKeys.length} verses`);

        // Get labels for ALL required verses (viewport + cross-refs + prophecies)
        const viewportLabels = getLabelsForVerses(mainTranslation, allRequiredVerseKeys, activeLabels);
        setLabelsData(viewportLabels);

        console.log(`🏷️ WORKER: Final viewport labels:`, Object.keys(viewportLabels).length, 'verses with labels out of', allRequiredVerseKeys.length, 'requested');
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