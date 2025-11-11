// Hook to load data when columns are toggled
import { useEffect } from 'react';
import { useBibleStore } from '@/App';
import { getProphecyRows, getProphecyIndex } from '@/data/BibleDataAPI';

export function useColumnData() {
  const showCrossRefs = useBibleStore(s => s.showCrossRefs);
  const showProphecies = useBibleStore(s => s.showProphecies);

  // Cross-reference data loading handled automatically by useCrossRefLoader

  // Load prophecy data when column is toggled
  useEffect(() => {
    if (showProphecies) {
      loadProphecyData();
    }
  }, [showProphecies]);

  // Deprecated cross-reference loader removed - handled by useCrossRefLoader with getCrossRefsBatch

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
    loadProphecyData
  };
}