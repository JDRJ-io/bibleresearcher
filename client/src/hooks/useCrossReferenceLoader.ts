import { useState, useEffect } from 'react';
import { loadCrossReferences, parseCrossReferences } from '@/data/BibleDataAPI';

export function useCrossReferenceLoader() {
  const [crossReferences, setCrossReferences] = useState<Map<string, Array<{reference: string, text?: string}>>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadCrossReferenceData = async () => {
    if (isLoaded || isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('🔄 Loading cross-references from Supabase...');
      const crossRefText = await loadCrossReferences();
      const parsedCrossRefs = parseCrossReferences(crossRefText);
      
      setCrossReferences(parsedCrossRefs);
      setIsLoaded(true);
      
      console.log(`✅ Loaded ${parsedCrossRefs.size} cross-reference entries`);
      
    } catch (error) {
      console.error('Failed to load cross-references:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCrossReferenceData();
  }, []);

  return { crossReferences, isLoading, isLoaded };
}