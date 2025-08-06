import { useMemo, useState } from 'react';
import type { Translation } from '@/types/bible';
import { useTranslationMaps } from '@/store/translationSlice';
import { useBibleStore } from '@/App';
import { useAdaptivePortraitColumns } from '@/hooks/useAdaptivePortraitColumns';
import { ColumnNavigationArrows } from './ColumnNavigationArrows';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

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
    maxVisibleColumns,
    unlockMode 
  } = useBibleStore();

  // Use the live store state instead of preferences for notes visibility
  const showNotes = storeShowNotes;

  // Use the same adaptive widths system as VirtualRow
  const { adaptiveWidths } = useAdaptivePortraitColumns();

  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localColumns, setLocalColumns] = useState<SimpleColumn[]>([]);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Sync columns with localColumns for drag and drop
  useMemo(() => {
    setLocalColumns(columns);
  }, [columns]);

  // Apply horizontal navigation filtering - always keep reference and dates columns visible
  const visibleColumns = useMemo(() => {
    const activeColumns = localColumns.length > 0 ? localColumns : columns;
    
    // Define which columns are always fixed (not affected by horizontal navigation)
    const fixedColumnTypes = ['reference'];
    
    // Separate fixed and navigable columns
    const fixedColumns = activeColumns.filter(col => fixedColumnTypes.includes(col.type));
    const navigableColumns = activeColumns.filter(col => !fixedColumnTypes.includes(col.type));
    
    // Apply offset to navigable columns
    const offsetNavigableColumns = navigableColumns.slice(columnOffset, columnOffset + maxVisibleColumns - fixedColumns.length);
    
    // Combine fixed columns (always first) with offset navigable columns
    return [...fixedColumns, ...offsetNavigableColumns];
  }, [localColumns, columns, columnOffset, maxVisibleColumns]);

  // Drag and drop handlers
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setLocalColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  }

  console.log('📋 NewColumnHeaders rendered with columns:', columns.map(c => ({ name: c.name, type: c.type, visible: c.visible })));
  console.log('📋 NewColumnHeaders showDates prop:', showDates);
  console.log('📋 NewColumnHeaders navigation state:', { 
    columnOffset, 
    maxVisibleColumns, 
    totalColumns: columns.length,
    visibleColumnsCount: visibleColumns.length,
    visibleColumnNames: visibleColumns.map(c => c.name)
  });

  const isPortrait = window.innerHeight > window.innerWidth;

  // SortableHeaderCell component for drag and drop
  function SortableHeaderCell({ column }: { column: SimpleColumn }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: column.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const isDraggable = unlockMode;

    return (
      <div
        ref={setNodeRef}
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
          ${isDragging ? 'opacity-50' : ''}
          ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
        style={{
          ...style,
          width: column.width,
          minWidth: column.width,
          maxWidth: column.width,
          boxSizing: 'border-box'
        }}
        data-column={column.type}
        {...(isDraggable ? attributes : {})}
        {...(isDraggable ? listeners : {})}
      >
        <div className="flex items-center gap-1">
          {isDraggable && (
            <GripVertical className="w-3 h-3 text-gray-400" />
          )}
          {column.name}
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
        
        {/* Column headers with drag and drop support */}
        <SortableContext 
          items={visibleColumns.map(col => col.id)} 
          strategy={horizontalListSortingStrategy}
        >
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
              <SortableHeaderCell key={column.id} column={column} />
            ))}
          </div>
        </SortableContext>

        {/* Drag overlay */}
        <DragOverlay>
          {activeId ? (
            <div
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
                bg-background
                opacity-75
              `}
              style={{
                width: visibleColumns.find(col => col.id === activeId)?.width,
                minWidth: visibleColumns.find(col => col.id === activeId)?.width,
                maxWidth: visibleColumns.find(col => col.id === activeId)?.width,
                boxSizing: 'border-box'
              }}
            >
              {visibleColumns.find(col => col.id === activeId)?.name}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}