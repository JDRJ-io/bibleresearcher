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
      console.log('🔮 Loading prophecy data...');
      const [prophecyRows, prophecyIndex] = await Promise.all([
        getProphecyRows(),
        getProphecyIndex()
      ]);
      
      console.log('✅ Prophecy data loaded:', {
        rowsSize: prophecyRows.length,
        indexKeys: Object.keys(prophecyIndex).length
      });
      
      // Parse and store prophecy data
      // This would typically parse the prophecy format and store in the store
      // For now, let's just log that it's loaded
    } catch (error) {
      console.error('❌ Failed to load prophecy data:', error);
    }
  };

  return {
    loadCrossReferenceData,
    loadProphecyData
  };
}