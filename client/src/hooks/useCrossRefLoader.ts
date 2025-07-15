import { useEffect, useRef } from 'react';
import { getCfOffsets, getCrossRefSlice } from '@/data/BibleDataAPI';
import { getCrossRefWorker } from '@/lib/workers';

export function useCrossRefLoader(verseKeys: string[], cfSet: 'cf1' | 'cf2' = 'cf1') {
  const processedKeys = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    const loadCrossRefs = async () => {
      const offsets = await getCfOffsets(cfSet);
      const worker = await getCrossRefWorker();
      
      for (const verseKey of verseKeys) {
        if (processedKeys.current.has(verseKey)) continue;
        
        const [start, end] = offsets[verseKey] ?? [];
        if (start !== undefined && end !== undefined) {
          const slice = await getCrossRefSlice(cfSet, start, end);
          worker.postMessage({ type: 'cfData', key: verseKey, text: slice });
          processedKeys.current.add(verseKey);
        }
      }
    };
    
    if (verseKeys.length > 0) {
      loadCrossRefs().catch(console.error);
    }
  }, [verseKeys, cfSet]);
}