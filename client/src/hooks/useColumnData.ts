// Hook to load data when columns are toggled
import { useEffect } from 'react';
import { useBibleStore } from '@/App';
import { getCrossRef, getProphecyRows, getProphecyIndex } from '@/data/BibleDataAPI';

export function useColumnData() {
  const { showCrossRefs, showProphecies } = useBibleStore();

  // Load cross-reference data when column is toggled
  useEffect(() => {
    if (showCrossRefs) {
      loadCrossReferenceData();
    }
  }, [showCrossRefs]);

  // Load prophecy data when column is toggled
  useEffect(() => {
    if (showProphecies) {
      loadProphecyData();
    }
  }, [showProphecies]);

  const loadCrossReferenceData = async () => {
    try {
      console.log('📖 Loading cross-reference data...');
      const crossRefData = await getCrossRef('cf1');
      console.log('✅ Cross-reference data loaded:', crossRefData.length, 'bytes');
      
      // Parse and store cross-reference data
      // This would typically parse the cf1.txt format and store in the store
      // For now, let's just log that it's loaded
    } catch (error) {
      console.error('❌ Failed to load cross-reference data:', error);
    }
  };

  const loadProphecyData = async () => {
    try {
      console.log('🔮 Starting prophecy data load...');
      
      // Use the same approach as cross-references - ensure data is loaded via prophecyCache
      const { ensureProphecyLoaded } = await import('@/lib/prophecyCache');
      await ensureProphecyLoaded();
      
      console.log('✅ Prophecy data loaded successfully via cache system');
    } catch (error) {
      console.error('❌ Failed to load prophecy data:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
    }
  };

  return {
    loadCrossReferenceData,
    loadProphecyData
  };
}