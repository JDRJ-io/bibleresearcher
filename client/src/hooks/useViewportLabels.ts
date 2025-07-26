
import { useEffect, useState, useMemo } from 'react';
import { ensureLabelCacheLoaded, getLabelsForVerses, LabelName } from '@/lib/labelsCache';
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
    if (activeLabels.length === 0 || !mainTranslation) {
      setLabelsData({});
      return;
    }

    const loadLabels = async () => {
      setIsLoading(true);
      try {
        // Ensure the label cache is loaded for this translation
        await ensureLabelCacheLoaded(mainTranslation);
        
        // Get labels only for the verses in viewport and only for active label types
        const viewportLabels = getLabelsForVerses(mainTranslation, verseKeys, activeLabels);
        setLabelsData(viewportLabels);
        
        // Optional: Log only if there are actual labels loaded
        if (Object.keys(viewportLabels).length > 0) {
          console.log(`Labels loaded for ${Object.keys(viewportLabels).length} verses`);
        }
      } catch (error) {
        console.error('Failed to load viewport labels:', error);
        setLabelsData({});
      } finally {
        setIsLoading(false);
      }
    };

    loadLabels();
  }, [verseKeys, activeLabels, mainTranslation]);

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
