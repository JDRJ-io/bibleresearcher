import { useEffect, useRef } from 'react';
import { getCfOffsets, getCrossRefSlice, loadTranslation } from '@/data/BibleDataAPI';
import { getCrossRefWorker } from '@/lib/workers';
import { useBibleStore } from '@/App';

export function useCrossRefLoader(verseKeys: string[], cfSet: 'cf1' | 'cf2' = 'cf1') {
  const processedKeys = useRef<Set<string>>(new Set());
  const { crossRefs: crossRefsStore } = useBibleStore();
  
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
      
      // Eager-load main translation for cross-ref snippets
      const allRefs = verseKeys.flatMap(verseId => crossRefsStore[verseId] ?? []);
      if (allRefs.length > 0) {
        console.log(`📖 Eager-loading cross-ref translations for ${allRefs.length} references`);
        // Load main translation to ensure cross-ref verse texts are available
        await loadTranslation('KJV'); // Ensure main translation is loaded
      }
    };
    
    if (verseKeys.length > 0) {
      loadCrossRefs().catch(console.error);
    }
  }, [verseKeys, cfSet, crossRefsStore]);
}