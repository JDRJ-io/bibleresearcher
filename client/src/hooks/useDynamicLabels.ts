import { useState, useEffect, useCallback } from 'react';
import { LabelName } from '@/lib/labelBits';
import { ensureLabelCacheLoaded, getLabelsForVerses } from '@/lib/labelsCache';

interface UseDynamicLabelsProps {
  mainTranslation: string;
  activeLabels: LabelName[];
  baseVerseKeys: string[]; // Viewport verses
}

export function useDynamicLabels({ 
  mainTranslation, 
  activeLabels, 
  baseVerseKeys 
}: UseDynamicLabelsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedVerses, setLoadedVerses] = useState<Set<string>>(new Set());
  const [labelsData, setLabelsData] = useState<Record<string, Partial<Record<LabelName, string[]>>>>({});

  // Load base viewport labels initially
  useEffect(() => {
    if (activeLabels.length === 0 || !mainTranslation) {
      setLabelsData({});
      setLoadedVerses(new Set());
      return;
    }

    const loadBaseLabels = async () => {
      setIsLoading(true);
      try {
        await ensureLabelCacheLoaded(mainTranslation, activeLabels);
        const viewportLabels = getLabelsForVerses(mainTranslation, baseVerseKeys, activeLabels);
        setLabelsData(viewportLabels);
        setLoadedVerses(new Set(baseVerseKeys));
        console.log('🔄 DYNAMIC: Loaded base viewport labels for', baseVerseKeys.length, 'verses');
      } catch (error) {
        console.error('❌ DYNAMIC: Failed to load base labels:', error);
        setLabelsData({});
      } finally {
        setIsLoading(false);
      }
    };

    loadBaseLabels();
  }, [activeLabels.join(), mainTranslation, baseVerseKeys.join('|')]);

  // Function to load labels for additional verses (cross-refs, prophecies)
  const loadLabelsForAdditionalVerses = useCallback(async (additionalVerses: string[]) => {
    if (activeLabels.length === 0 || !mainTranslation) return;

    // Filter out verses we already have
    const newVerses = additionalVerses.filter(verse => !loadedVerses.has(verse));
    if (newVerses.length === 0) return;

    console.log('🔄 DYNAMIC: Loading labels for additional verses:', newVerses.slice(0, 5), '...');

    try {
      // Ensure cache is loaded (this is idempotent if already loaded)
      await ensureLabelCacheLoaded(mainTranslation, activeLabels);
      
      // Get labels for the new verses
      const newLabels = getLabelsForVerses(mainTranslation, newVerses, activeLabels);
      
      // Merge with existing data
      setLabelsData(prev => ({ ...prev, ...newLabels }));
      setLoadedVerses(prev => new Set([...Array.from(prev), ...newVerses]));
      
      console.log('✅ DYNAMIC: Loaded labels for', newVerses.length, 'additional verses');
    } catch (error) {
      console.error('❌ DYNAMIC: Failed to load additional labels:', error);
    }
  }, [activeLabels.join(), mainTranslation, loadedVerses]);

  // Function to get labels for a specific verse
  const getVerseLabels = useCallback((verseReference: string): Partial<Record<LabelName, string[]>> => {
    return labelsData[verseReference] || {};
  }, [labelsData]);

  return {
    isLoading,
    getVerseLabels,
    loadLabelsForAdditionalVerses,
    hasLabelsData: Object.keys(labelsData).length > 0
  };
}