
import { useEffect, useState, useMemo } from 'react';
import { ensureLabelCacheLoaded, getLabelsForVerses } from '@/lib/labelsCache';
import type { LabelName } from '@/lib/labelBits';
import type { BibleVerse } from '@/types/bible';

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

  // Load labels when translation or active labels change
  useEffect(() => {
    console.log('🔄 WORKER: useViewportLabels effect triggered', { activeLabels, mainTranslation, verseCount: verses.length });
    
    if (activeLabels.length === 0 || !mainTranslation) {
      console.log('🔄 WORKER: No active labels, clearing data');
      setLabelsData({});
      return;
    }

    const loadLabels = async () => {
      setIsLoading(true);
      console.log(`🔄 WORKER: Loading labels for ${activeLabels.length} active labels:`, activeLabels, 'translation:', mainTranslation);
      try {
        // Pass activeLabels to cache loader for worker filtering
        console.log(`🔄 WORKER: About to call ensureLabelCacheLoaded...`);
        await ensureLabelCacheLoaded(mainTranslation, activeLabels);
        console.log(`✅ WORKER: Cache loaded, getting labels for ${verseKeys.length} verses`);
        
        // Get labels only for the verses in viewport and only for active label types
        const viewportLabels = getLabelsForVerses(mainTranslation, verseKeys, activeLabels);
        setLabelsData(viewportLabels);
        
        console.log(`🏷️ WORKER: Final viewport labels:`, Object.keys(viewportLabels).length, 'verses with labels:', viewportLabels);
      } catch (error) {
        console.error('❌ WORKER: Failed to load viewport labels:', error);
        setLabelsData({});
      } finally {
        setIsLoading(false);
      }
    };

    loadLabels();
  }, [activeLabels.join(), mainTranslation, verseKeys.join('|')]); // Use .join() for array deps

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
