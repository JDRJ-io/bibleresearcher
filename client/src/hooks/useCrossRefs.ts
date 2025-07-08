import { useState, useEffect } from 'react';
import { useBibleStore } from '@/providers/BibleDataProvider';

interface CrossRefEntry {
  refIndex: number;
  ref: string; // "Matt 1:23" format
  text?: string; // Main translation only
}

export function useCrossRefs(slice: string[]) {
  const [crossRefs, setCrossRefs] = useState<Map<string, CrossRefEntry[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [currentSet, setCurrentSet] = useState<'cf1' | 'cf2'>('cf1');

  // Combine loaders - when fetching verses for the visible slice, also fire parallel calls
  useEffect(() => {
    const loadCrossRefs = async () => {
      setIsLoading(true);
      try {
        // const [verses, crossRefs, prophecy] = await Promise.all([...]);
        const response = await fetch(`/api/cross-references/${currentSet}`);
        const data = await response.text();
        
        // Parse cross-reference format: Gen.1:1$$John.1:1#John.1:2#John.1:3$Heb.11:3
        const parsedRefs = new Map<string, CrossRefEntry[]>();
        
        data.split('\n').forEach(line => {
          if (!line.trim()) return;
          
          const [verseId, refsStr] = line.split('$$');
          if (!verseId || !refsStr) return;
          
          const groups = refsStr.split('$');
          const allRefs: CrossRefEntry[] = [];
          
          groups.forEach((group, groupIndex) => {
            const refs = group.split('#');
            refs.forEach((ref, refIndex) => {
              if (ref.trim()) {
                allRefs.push({
                  refIndex: groupIndex * 1000 + refIndex,
                  ref: ref.trim(),
                  text: '' // Will be populated from main translation
                });
              }
            });
          });
          
          parsedRefs.set(verseId, allRefs);
        });
        
        setCrossRefs(parsedRefs);
      } catch (error) {
        console.error('Failed to load cross-references:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slice.length > 0) {
      loadCrossRefs();
    }
  }, [slice, currentSet]);

  // Loader: loadCrossRefs(slice, set) now returns { refs: 'Matt 1:23', textMain:'...' }[]
  const getCrossRefsForVerse = (verseId: string): CrossRefEntry[] => {
    return crossRefs.get(verseId) || [];
  };

  const switchSet = (set: 'cf1' | 'cf2') => {
    setCurrentSet(set);
  };

  return {
    getCrossRefsForVerse,
    switchSet,
    currentSet,
    isLoading,
    stats: {
      cf1: 29315, // Standard cross-references
      cf2: 30692  // Extended cross-references
    }
  };
}