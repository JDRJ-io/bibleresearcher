import { useMemo } from 'react';
import type { Translation } from '@/types/bible';
import { useTranslationMaps } from '@/store/translationSlice';
import { useBibleStore } from '@/App';
import { useAdaptivePortraitColumns } from '@/hooks/useAdaptivePortraitColumns';

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

interface SimpleColumn {
  id: string;
  name: string;
  type: 'reference' | 'main-translation' | 'alt-translation' | 'cross-refs' | 'notes' | 'context' | 'prophecy';
  visible: boolean;
  width: string;
}

export function NewColumnHeaders({ 
  selectedTranslations, 
  showNotes, 
  showProphecy, 
  showCrossRefs = false,
  showContext, 
  scrollLeft, 
  preferences, 
  isGuest = true 
}: NewColumnHeadersProps) {
  const { main, alternates } = useTranslationMaps();
  const { isInitialized } = useBibleStore();
  
  // Use the same adaptive widths system as VirtualRow
  const { adaptiveWidths } = useAdaptivePortraitColumns();

  // Don't render until store is ready
  if (!isInitialized) {
    return null;
  }

  // Function to get responsive width (matching VirtualRow logic exactly)
  const getResponsiveWidth = (columnType: string): string => {
    const isPortrait = window.innerHeight > window.innerWidth;

    if (isPortrait) {
      // Portrait mode - use adaptive CSS variables (IDENTICAL to VirtualRow)
      if (columnType === 'reference') return 'var(--adaptive-ref-width)';
      if (columnType === 'main-translation') return 'var(--adaptive-main-width)';
      if (columnType === 'cross-refs') return 'var(--adaptive-cross-width)';
      if (columnType === 'alt-translation') return 'var(--adaptive-alt-width)';
      if (columnType === 'prophecy') return 'var(--adaptive-prophecy-width)';
      if (columnType === 'notes') return 'var(--adaptive-notes-width)';
      if (columnType === 'context') return 'var(--adaptive-context-width)';
      return 'var(--adaptive-alt-width)';
    } else {
      // Landscape mode - use unified variables (IDENTICAL to VirtualRow)
      if (columnType === 'reference') return 'var(--ref-col-width)';
      if (columnType === 'main-translation') return 'var(--main-col-width)';
      if (columnType === 'cross-refs') return 'var(--xref-col-width)';
      if (columnType === 'alt-translation') return 'var(--alt-col-width)';
      if (columnType === 'prophecy') return 'var(--prophecy-col-width)';
      if (columnType === 'notes') return 'var(--alt-col-width)';
      if (columnType === 'context') return 'calc(12rem * var(--column-width-mult))';
      return 'var(--alt-col-width)';
    }
  };

  // Build clean column configuration
  const columns: SimpleColumn[] = useMemo(() => {
    const cols: SimpleColumn[] = [];

    // 1. Reference column (always visible)
    cols.push({
      id: 'reference',
      name: 'Ref',
      type: 'reference',
      visible: true,
      width: getResponsiveWidth('reference')
    });

    // 2. Context/Dates column
    if (showContext) {
      cols.push({
        id: 'context',
        name: 'Dates',
        type: 'context',
        visible: true,
        width: getResponsiveWidth('context')
      });
    }

    // 3. Notes column
    if (showNotes) {
      cols.push({
        id: 'notes',
        name: 'Notes',
        type: 'notes',
        visible: true,
        width: getResponsiveWidth('notes')
      });
    }

    // 4. Main translation (always visible)
    cols.push({
      id: 'main-translation',
      name: main || 'KJV',
      type: 'main-translation',
      visible: true,
      width: getResponsiveWidth('main-translation')
    });

    // 5. Alternate translations (filter out main to avoid duplication)
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

    // 6. Cross references
    if (showCrossRefs) {
      cols.push({
        id: 'cross-refs',
        name: 'Cross Refs',
        type: 'cross-refs',
        visible: true,
        width: getResponsiveWidth('cross-refs')
      });
    }

    // 7. Prophecy columns
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

    return cols.filter(col => col.visible);
  }, [main, alternates, showNotes, showContext, showCrossRefs, showProphecy, adaptiveWidths]);

  console.log('📋 NewColumnHeaders rendered with columns:', columns.map(c => ({ name: c.name, type: c.type })));

  return (
    <div 
      className="column-headers-row sticky top-0 z-20 bg-background border-b flex"
      style={{ left: -scrollLeft }}
    >
      {columns.map((column) => (
        <div
          key={column.id}
          className={`
            column-header-cell 
            flex-shrink-0 
            flex 
            items-center 
            justify-center 
            border-r 
            px-2 
            py-1 
            font-bold 
            text-xs 
            leading-none
            ${column.type === 'main-translation' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-background'}
            ${column.type === 'reference' ? 'text-sm' : 'text-xs'}
          `}
          style={{
            width: column.width,
            minWidth: column.width
          }}
          data-column={column.type}
        >
          {column.name}
        </div>
      ))}
    </div>
  );
}