import { useMemo, useState, useEffect } from 'react';
import type { Translation } from '@/types/bible';
import { useTranslationMaps } from '@/store/translationSlice';
import { useBibleStore } from '@/App';
import { useAdaptivePortraitColumns } from '@/hooks/useAdaptivePortraitColumns';
import { useLayoutStore, ColumnId, COL_WIDTH } from '@/store/useLayoutStore';
import { ArrowPager } from './ArrowPager';

interface NewColumnHeadersProps {
  selectedTranslations: Translation[];
  showNotes: boolean;
  showProphecy: boolean;
  showCrossRefs?: boolean;
  showContext: boolean;
  scrollLeft: number;
  preferences: any;
  isGuest?: boolean;
}

export function NewColumnHeadersWithLayout({ 
  selectedTranslations, 
  showNotes: propShowNotes, 
  showProphecy, 
  showCrossRefs = false,
  showContext, 
  scrollLeft, 
  preferences, 
  isGuest = true 
}: NewColumnHeadersProps) {
  const { main, alternates } = useTranslationMaps();
  const { isInitialized, showNotes: storeShowNotes, showDates, showCrossRefs: storeCrossRefs, showProphecies } = useBibleStore();
  const { mode, visible } = useLayoutStore();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Use the live store state instead of preferences
  const showNotes = storeShowNotes;
  
  // Don't render until store is ready
  if (!isInitialized) {
    return null;
  }
  
  // Map column IDs to display properties
  const getColumnDisplay = (columnId: ColumnId): { name: string; visible: boolean } | null => {
    switch (columnId) {
      case 'ref':
        return { name: '#', visible: true };
      case 'dates':
        return { name: 'Dates', visible: showDates };
      case 'notes':
        return { name: 'Notes', visible: showNotes };
      case 'main':
        return { name: main || 'KJV', visible: true };
      case 'crossRefs':
        return { name: 'Cross Refs', visible: storeCrossRefs };
      case 'prediction':
        return { name: 'P', visible: showProphecies };
      case 'verification':
        return { name: 'V', visible: showProphecies };
      case 'fulfillment':
        return { name: 'F', visible: showProphecies };
      default:
        // Handle alternate translations
        if (columnId.startsWith('alt-')) {
          const altIndex = parseInt(columnId.split('-')[1]) - 1;
          const altCode = alternates[altIndex];
          return altCode ? { name: altCode, visible: true } : null;
        }
        return null;
    }
  };
  
  // Get visible columns based on mode
  const visibleColumns = visible(windowWidth);
  
  // Build column headers
  const columns = visibleColumns
    .map(columnId => {
      const display = getColumnDisplay(columnId);
      if (!display || !display.visible) return null;
      
      return {
        id: columnId,
        name: display.name,
        width: COL_WIDTH[columnId]
      };
    })
    .filter(Boolean);
  
  // Calculate header layout styles
  const getHeaderStyle = () => {
    if (mode === 'context-lens') {
      // Simple layout for context lens mode
      return {
        display: 'flex',
        width: '100%'
      };
    }
    
    if (mode === 'carousel') {
      // Fixed layout with scroll prevention
      return {
        display: 'flex',
        width: 'fit-content',
        minWidth: '100%',
        position: 'relative' as const
      };
    }
    
    // Grid mode - existing behavior
    return {
      display: 'flex',
      width: 'fit-content',
      minWidth: '100%'
    };
  };
  
  return (
    <div className="sticky top-0 z-20 bg-background border-b">
      <div style={getHeaderStyle()}>
        {columns.map((column) => (
          <div
            key={column.id}
            className="px-2 py-3 text-sm font-medium text-muted-foreground border-r last:border-r-0 flex-shrink-0"
            style={{ 
              width: `${column.width}px`,
              minWidth: `${column.width}px` 
            }}
          >
            {column.name}
          </div>
        ))}
      </div>
      
      {/* Show pager controls in carousel mode */}
      {mode === 'carousel' && (
        <ArrowPager windowPx={windowWidth} />
      )}
    </div>
  );
}