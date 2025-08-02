import { useMemo } from 'react';
import type { Translation } from '@/types/bible';
import { useTranslationMaps } from '@/store/translationSlice';
import { useBibleStore } from '@/App';

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

  // Don't render until store is ready
  if (!isInitialized) {
    return null;
  }

  // Build clean column configuration
  const columns: SimpleColumn[] = useMemo(() => {
    const cols: SimpleColumn[] = [];

    // 1. Reference column (always visible)
    cols.push({
      id: 'reference',
      name: 'Ref',
      type: 'reference',
      visible: true,
      width: 'var(--ref-col-width, 4rem)'
    });

    // 2. Context/Dates column
    if (showContext) {
      cols.push({
        id: 'context',
        name: 'Dates',
        type: 'context',
        visible: true,
        width: 'var(--context-col-width, 8rem)'
      });
    }

    // 3. Notes column
    if (showNotes) {
      cols.push({
        id: 'notes',
        name: 'Notes',
        type: 'notes',
        visible: true,
        width: 'var(--notes-col-width, 12rem)'
      });
    }

    // 4. Main translation (always visible)
    cols.push({
      id: 'main-translation',
      name: main || 'KJV',
      type: 'main-translation',
      visible: true,
      width: 'var(--main-col-width, 20rem)'
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
          width: 'var(--alt-col-width, 18rem)'
        });
      });

    // 6. Cross references
    if (showCrossRefs) {
      cols.push({
        id: 'cross-refs',
        name: 'Cross Refs',
        type: 'cross-refs',
        visible: true,
        width: 'var(--xref-col-width, 16rem)'
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
          width: 'var(--prophecy-col-width, 16rem)'
        },
        {
          id: 'prophecy-fulfillment',
          name: 'Fulfillment',
          type: 'prophecy',
          visible: true,
          width: 'var(--prophecy-col-width, 16rem)'
        },
        {
          id: 'prophecy-verification',
          name: 'Verification',
          type: 'prophecy',
          visible: true,
          width: 'var(--prophecy-col-width, 16rem)'
        }
      );
    }

    return cols.filter(col => col.visible);
  }, [main, alternates, showNotes, showContext, showCrossRefs, showProphecy]);

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