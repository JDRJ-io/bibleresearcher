import { useMemo } from 'react';
import type { Translation } from '@/types/bible';
import { useTranslationMaps } from '@/store/translationSlice';
import { useBibleStore } from '@/App';
import { useAdaptivePortraitColumns } from '@/hooks/useAdaptivePortraitColumns';
import { ColumnNavigationArrows } from './ColumnNavigationArrows';

interface NewColumnHeadersProps {
  selectedTranslations: Translation[];
  showNotes: boolean;
  showProphecy: boolean;
  showCrossRefs?: boolean;
  showDates?: boolean;
  scrollLeft: number;
  preferences: any;
  isGuest?: boolean;
}

interface SimpleColumn {
  id: string;
  name: string;
  type: 'reference' | 'main-translation' | 'alt-translation' | 'cross-refs' | 'notes' | 'context' | 'prophecy';
  visible: boolean;
  width: string;
}

export function NewColumnHeaders({ 
  selectedTranslations, 
  showNotes: propShowNotes, 
  showProphecy, 
  showCrossRefs = false,
  showDates = false,
  scrollLeft, 
  preferences, 
  isGuest = true 
}: NewColumnHeadersProps) {
  const { main, alternates } = useTranslationMaps();
  const { 
    isInitialized, 
    showNotes: storeShowNotes, 
    columnOffset, 
    maxVisibleColumns 
  } = useBibleStore();

  // Use the live store state instead of preferences for notes visibility
  const showNotes = storeShowNotes;

  // Use the same adaptive widths system as VirtualRow
  const { adaptiveWidths } = useAdaptivePortraitColumns();

  // Don't render until store is ready
  if (!isInitialized) {
    return null;
  }

  // Function to get exact responsive width in pixels (matching VirtualRow logic exactly)
  const getResponsiveWidth = (columnType: string): string => {
    const isPortrait = window.innerHeight > window.innerWidth;

    if (isPortrait) {
      // Portrait mode - use CSS variables to match VirtualRow exactly
      if (columnType === 'reference') return 'var(--adaptive-ref-width)';
      if (columnType === 'main-translation') return 'var(--adaptive-main-width)';
      if (columnType === 'cross-refs') return 'var(--adaptive-cross-width)';
      if (columnType === 'alt-translation') return 'var(--adaptive-alt-width)';
      if (columnType === 'prophecy') return 'var(--adaptive-prophecy-width)';
      if (columnType === 'notes') return 'var(--adaptive-notes-width)';
      if (columnType === 'context') return 'var(--adaptive-context-width)';
      return 'var(--adaptive-alt-width)';
    } else {
      // Landscape mode - use adaptive CSS variables for consistency
      if (columnType === 'reference') return 'var(--adaptive-ref-width)';
      if (columnType === 'main-translation') return 'var(--adaptive-main-width)';
      if (columnType === 'cross-refs') return 'var(--adaptive-cross-width)';
      if (columnType === 'alt-translation') return 'var(--adaptive-alt-width)';
      if (columnType === 'prophecy') return 'var(--adaptive-prophecy-width)';
      if (columnType === 'notes') return 'var(--adaptive-notes-width)';
      if (columnType === 'context') return 'var(--adaptive-context-width)';
      return 'var(--adaptive-cross-width)';
    }
  };

  // Build clean column configuration
  const columns: SimpleColumn[] = useMemo(() => {
    const cols: SimpleColumn[] = [];

    // 1. Reference column (always visible)
    cols.push({
      id: 'reference',
      name: '#',
      type: 'reference',
      visible: true,
      width: getResponsiveWidth('reference')
    });

    // 2. Dates column (showDates controls the dates column)
    if (showDates) {
      cols.push({
        id: 'dates',
        name: '📅',
        type: 'context',
        visible: true,
        width: getResponsiveWidth('context')
      });
    }

    // Context boundaries is not a visual column - it's background data processing

    // 4. Notes column
    if (showNotes) {
      cols.push({
        id: 'notes',
        name: 'Notes',
        type: 'notes',
        visible: true,
        width: getResponsiveWidth('notes')
      });
    }

    // 5. Main translation (always visible)
    cols.push({
      id: 'main-translation',
      name: main || 'KJV',
      type: 'main-translation',
      visible: true,
      width: getResponsiveWidth('main-translation')
    });

    // 6. Cross references (should come before alternate translations)
    if (showCrossRefs) {
      cols.push({
        id: 'cross-refs',
        name: 'Cross Refs',
        type: 'cross-refs',
        visible: true,
        width: getResponsiveWidth('cross-refs')
      });
    }

    // 7. Prophecy columns (should come before alternate translations)
    if (showProphecy) {
      cols.push(
        {
          id: 'prophecy-prediction',
          name: 'Prediction',
          type: 'prophecy',
          visible: true,
          width: getResponsiveWidth('prophecy')
        },
        {
          id: 'prophecy-fulfillment',
          name: 'Fulfillment',
          type: 'prophecy',
          visible: true,
          width: getResponsiveWidth('prophecy')
        },
        {
          id: 'prophecy-verification',
          name: 'Verification',
          type: 'prophecy',
          visible: true,
          width: getResponsiveWidth('prophecy')
        }
      );
    }

    // 8. Alternate translations (filter out main to avoid duplication)
    alternates
      .filter(code => code !== main)
      .forEach((code, index) => {
        cols.push({
          id: `alt-translation-${code}`,
          name: code,
          type: 'alt-translation',
          visible: true,
          width: getResponsiveWidth('alt-translation')
        });
      });

    return cols.filter(col => col.visible);
  }, [main, alternates, showNotes, showDates, showCrossRefs, showProphecy, adaptiveWidths]);

  // Apply horizontal navigation filtering - always keep reference and dates columns visible
  const visibleColumns = useMemo(() => {
    // Define which columns are always fixed (not affected by horizontal navigation)
    const fixedColumnTypes = ['reference'];
    
    // Separate fixed and navigable columns
    const fixedColumns = columns.filter(col => fixedColumnTypes.includes(col.type));
    const navigableColumns = columns.filter(col => !fixedColumnTypes.includes(col.type));
    
    // Apply offset to navigable columns
    const offsetNavigableColumns = navigableColumns.slice(columnOffset, columnOffset + maxVisibleColumns - fixedColumns.length);
    
    // Combine fixed columns (always first) with offset navigable columns
    return [...fixedColumns, ...offsetNavigableColumns];
  }, [columns, columnOffset, maxVisibleColumns]);

  console.log('📋 NewColumnHeaders rendered with columns:', columns.map(c => ({ name: c.name, type: c.type, visible: c.visible })));
  console.log('📋 NewColumnHeaders showDates prop:', showDates);

  const isPortrait = window.innerHeight > window.innerWidth;

  return (
    <div 
      className="column-headers-wrapper sticky top-0 z-20 bg-background border-b"
      style={{ 
        width: '100%'
      }}
    >
      {/* Navigation arrows positioned above the headers */}
      <div className="flex justify-between items-center px-4 py-1 bg-gray-50 dark:bg-gray-900 border-b">
        <div className="flex-1" />
        <ColumnNavigationArrows />
        <div className="flex-1" />
      </div>
      
      {/* Column headers - no horizontal scroll, only showing offset columns */}
      <div 
        className="column-headers-inner flex"
        style={{ 
          minWidth: 'max-content',
          width: 'max-content',
          margin: isPortrait ? '0' : '0 auto', // Match the tableInner margin
          overflowX: 'hidden' // Prevent horizontal scroll - navigation arrows control visibility
        }}
      >
        {visibleColumns.map((column) => (
          <div
            key={column.id}
            className={`
              column-header-cell 
              flex-shrink-0 
              flex 
              items-center 
              justify-center 
              border-r 
              font-bold 
              text-xs 
              leading-none
              ${column.type === 'main-translation' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-background'}
              ${column.type === 'reference' ? 'text-sm p-0' : 'text-xs px-2 py-1'}
            `}
            style={{
              width: column.width,
              minWidth: column.width,
              maxWidth: column.width,
              boxSizing: 'border-box'
            }}
            data-column={column.type}
          >
            {column.name}
          </div>
        ))}
      </div>
    </div>
  );
}