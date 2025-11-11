import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { ensureLabelCacheLoaded, getLabelsForVerses } from '@/lib/labelsCache';
import type { LabelName } from '@/lib/labelBits';
import type { BibleVerse } from '@/types/bible';
import { useBibleStore } from '@/App';
import { debounce, createArrayToken } from '@/utils/timing';

interface UseViewportLabelsProps {
  verses: BibleVerse[];
  activeLabels: LabelName[];
  mainTranslation: string;
  additionalVerseRefs?: string[]; // Cross-refs, prophecy verses, etc. from outside viewport
}

export function useViewportLabels({ verses, activeLabels, mainTranslation, additionalVerseRefs = [] }: UseViewportLabelsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [labelsData, setLabelsData] = useState<Record<string, Partial<Record<LabelName, string[]>>>>({});

  // Extract verse keys from verses
  const verseKeys = useMemo(() => 
    verses.map(verse => verse.reference), 
    [verses]
  );

  // PERF FIX: Use stable token instead of expensive join
  const verseKeysToken = useMemo(() => createArrayToken(verseKeys), [
    verseKeys.length,
    verseKeys[0],
    verseKeys[verseKeys.length - 1]
  ]);

  // Create stable token for additional verses
  const additionalKeysToken = useMemo(() => createArrayToken(additionalVerseRefs), [
    additionalVerseRefs.length,
    additionalVerseRefs[0],
    additionalVerseRefs[additionalVerseRefs.length - 1]
  ]);

  // Batch ALL verses together: viewport + cross-refs + prophecy + master panel
  const allRequiredVerseKeys = useMemo(() => {
    // Combine and deduplicate viewport verses with additional verses (cross-refs, prophecies, etc.)
    const combined = [...verseKeys, ...additionalVerseRefs];
    return Array.from(new Set(combined));
  }, [verseKeysToken, additionalKeysToken]);

  // PERF FIX: Debounce label loading to reduce triggers during scroll (300ms)
  // Store the latest load function in a ref to avoid stale closures
  const loadFnRef = useRef<() => Promise<void>>();
  const debouncedLoadRef = useRef<() => void>();

  // Load labels when translation or active labels change
  useEffect(() => {

    if (activeLabels.length === 0 || !mainTranslation) {
      setLabelsData({});
      return;
    }

    const loadLabels = async () => {
      setIsLoading(true);
      try {
        // Normalize active labels before passing to worker
        const normActive = activeLabels.map(lbl => lbl.toLowerCase() as LabelName);
        await ensureLabelCacheLoaded(mainTranslation, normActive, allRequiredVerseKeys);

        // Get labels for ALL required verses (viewport + cross-refs + prophecies)
        const viewportLabels = getLabelsForVerses(mainTranslation, allRequiredVerseKeys, activeLabels);
        setLabelsData(viewportLabels);

        
        // Debug: Show some specific examples of loaded labels
        const labeledVerses = Object.keys(viewportLabels).filter(v => Object.keys(viewportLabels[v]).length > 0).slice(0, 3);
        if (labeledVerses.length > 0) {
        }
      } catch (error) {
        console.error('❌ WORKER: Failed to load viewport labels:', error);
        setLabelsData({});
      } finally {
        setIsLoading(false);
      }
    };

    // Store the latest function so debounced wrapper always calls current version
    loadFnRef.current = loadLabels;

    // Create debounced wrapper once that calls through the ref
    if (!debouncedLoadRef.current) {
      debouncedLoadRef.current = debounce(() => {
        loadFnRef.current?.();
      }, 300);
    }

    // Call debounced version to reduce load frequency during scroll
    debouncedLoadRef.current();
  }, [activeLabels.join(), mainTranslation, verseKeysToken, additionalKeysToken]); // FIX: Watch additional verses too

  // PERF FIX: Memoize the getter function to prevent recreation on every render
  // This ensures VirtualRow's React.memo doesn't break when this prop is passed
  const getVerseLabels = useCallback((verseReference: string): Partial<Record<LabelName, string[]>> => {
    return labelsData[verseReference] || {};
  }, [labelsData]);

  return {
    isLoading,
    getVerseLabels,
    hasLabelsData: Object.keys(labelsData).length > 0
  };
}