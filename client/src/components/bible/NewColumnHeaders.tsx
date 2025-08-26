import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type { Translation } from '@/types/bible';
import { useTranslationMaps } from '@/store/translationSlice';
import { useBibleStore } from '@/App';
import { useAdaptivePortraitColumns } from '@/hooks/useAdaptivePortraitColumns';
import { Button } from '@/components/ui/button';
import { Monitor, RotateCcw } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
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
  bodyRef?: React.RefObject<HTMLElement>;
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
  isGuest = true,
  bodyRef
}: NewColumnHeadersProps) {
  const { main, alternates } = useTranslationMaps();

  // Track alternate translation changes (logging removed for performance)
  const store = useBibleStore();
  const { 
    isInitialized, 
    showNotes: storeShowNotes, 
    unlockMode 
  } = store;

  // Use the live store state instead of preferences for notes visibility
  const showNotes = storeShowNotes;

  // Create refs for scroll navigation
  const headerRef = useRef<HTMLDivElement>(null);
  // bodyRef is passed in from props

  // Use the same adaptive widths system as VirtualRow
  const { adaptiveWidths } = useAdaptivePortraitColumns();

  // Custom hook to track CSS variable changes for column width multiplier
  const [columnWidthMult, setColumnWidthMult] = useState(1);

  // Presentation mode state
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Import the column change signal hook
  const { useColumnChangeSignal, useColumnChangeEmitter } = useMemo(() => {
    // Dynamic import to avoid circular dependencies
    return {
      useColumnChangeSignal: null,
      useColumnChangeEmitter: null
    };
  }, []);

  useEffect(() => {
    // Function to get current column width multiplier
    const updateColumnWidthMult = () => {
      const mult = getComputedStyle(document.documentElement)
        .getPropertyValue('--column-width-mult')
        .trim();
      const numericMult = parseFloat(mult) || 1;
      
      if (Math.abs(numericMult - columnWidthMult) > 0.01) {
        setColumnWidthMult(numericMult);
      }
    };

    // Set initial value
    updateColumnWidthMult();

    // Watch for direct CSS variable changes using MutationObserver
    const observer = new MutationObserver(() => {
      updateColumnWidthMult();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => {
      observer.disconnect();
    };
  }, [columnWidthMult, adaptiveWidths]);

  // Presentation mode toggle - width x2, text x1.5, row height x1.35
  const togglePresentationMode = useCallback(async () => {
    if (!isPresentationMode) {
      // Enter presentation mode
      document.documentElement.style.setProperty('--column-width-mult', '2');
      document.documentElement.style.setProperty('--text-size-mult', '1.5');
      document.documentElement.style.setProperty('--row-height-mult', '1.35');
      setIsPresentationMode(true);
      console.log('🎛️ Presentation Mode: ON (width x2, text x1.5, row x1.35)');

      // Emit column change signal
      try {
        const { useColumnChangeEmitter } = await import('@/hooks/useColumnChangeSignal');
        const signal = useColumnChangeEmitter();
        signal('multiplier', { multiplier: 2, presentationMode: true });
      } catch (error) {
        console.warn('Could not emit column change signal');
      }
    } else {
      // Exit presentation mode - reset to defaults
      document.documentElement.style.setProperty('--column-width-mult', '1');
      document.documentElement.style.setProperty('--text-size-mult', '1');
      document.documentElement.style.setProperty('--row-height-mult', '1');
      setIsPresentationMode(false);
      console.log('🎛️ Presentation Mode: OFF (reset to defaults)');

      // Emit column change signal
      try {
        const { useColumnChangeEmitter } = await import('@/hooks/useColumnChangeSignal');
        const signal = useColumnChangeEmitter();
        signal('multiplier', { multiplier: 1, presentationMode: false });
      } catch (error) {
        console.warn('Could not emit column change signal');
      }
    }
  }, [isPresentationMode]);

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
  // NOW CONNECTED TO --column-width-mult from ManualSizeController
  const getResponsiveWidth = (columnType: string): string => {
    // Get base width from adaptiveWidths and multiply by current columnWidthMult
    let baseWidth: number;
    
    if (columnType === 'reference') baseWidth = adaptiveWidths.reference;
    else if (columnType === 'main-translation') baseWidth = adaptiveWidths.mainTranslation;
    else if (columnType === 'cross-refs') baseWidth = adaptiveWidths.crossReference;
    else if (columnType === 'alt-translation') baseWidth = adaptiveWidths.alternate;
    else if (columnType === 'prophecy') baseWidth = adaptiveWidths.prophecy;
    else if (columnType === 'notes') baseWidth = adaptiveWidths.notes;
    else if (columnType === 'context') baseWidth = adaptiveWidths.context;
    else baseWidth = adaptiveWidths.alternate;
    
    // Apply column width multiplier to get actual pixel width
    const actualWidth = baseWidth * columnWidthMult;
    
    return `${actualWidth}px`;
  };

  // Build clean column configuration - NOW DEPENDS ON columnWidthMult for reactive updates
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

    // 2. Dates are now inline with reference column - no separate header needed

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
    if (store.showPrediction) {
      cols.push({
        id: 'prophecy-prediction',
        name: 'Prediction',
        type: 'prophecy',
        visible: true,
        width: getResponsiveWidth('prophecy')
      });
    }
    
    if (store.showFulfillment) {
      cols.push({
        id: 'prophecy-fulfillment',
        name: 'Fulfillment',
        type: 'prophecy',
        visible: true,
        width: getResponsiveWidth('prophecy')
      });
    }
    
    if (store.showVerification) {
      cols.push({
        id: 'prophecy-verification',
        name: 'Verification',
        type: 'prophecy',
        visible: true,
        width: getResponsiveWidth('prophecy')
      });
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
  }, [main, alternates, showNotes, showDates, showCrossRefs, store.showPrediction, store.showFulfillment, store.showVerification, adaptiveWidths, columnWidthMult]);

  // Sync columns with localColumns for drag and drop
  useMemo(() => {
    setLocalColumns(columns);
  }, [columns]);

  // For now, use direct columns to avoid infinite render loops
  const visibleColumns = columns;

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

        const reorderedItems = arrayMove(items, oldIndex, newIndex);

        // Update the store's column order to sync with header order
        // Map column types to their corresponding slots for the store
        const typeToSlotMap: Record<string, number> = {
          'reference': 0,
          'context': 1,  // dates
          'notes': 2,
          'main-translation': 3,
          'cross-refs': 7,
          'prophecy-prediction': 8,
          'prophecy-fulfillment': 9,
          'prophecy-verification': 10,
          'alt-translation': 12, // base slot for alternates
        };

        // Update displayOrder in store to match new header order
        reorderedItems.forEach((column, index) => {
          const slot = typeToSlotMap[column.type];
          if (slot !== undefined && store.columnState?.columns) {
            const columnInfo = store.columnState.columns.find(col => col.slot === slot);
            if (columnInfo) {
              columnInfo.displayOrder = index;
            }
          }
        });

        // Emit column order change signal to notify other components
        const emitOrderSignal = async () => {
          try {
            const { useColumnChangeEmitter } = await import('@/hooks/useColumnChangeSignal');
            const signal = useColumnChangeEmitter();
            signal('order', { 
              reorderedColumns: reorderedItems,
              oldIndex,
              newIndex,
              timestamp: Date.now()
            });
          } catch (error) {
            console.warn('Could not emit column order change signal');
          }
        };
        
        emitOrderSignal();

        return reorderedItems;
      });
    }

    setActiveId(null);
  }

  // Column rendering logs removed for performance

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
          ${column.type === 'reference' ? 'text-sm p-0' : 'text-xs px-2 py-1'}
          ${isDragging ? 'opacity-50' : ''}
          ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
        style={{
          ...style,
          width: column.width,
          minWidth: column.width,
          maxWidth: column.width,
          boxSizing: 'border-box',
          backgroundColor: column.type === 'main-translation' ? 'var(--highlight-bg)' : 'var(--bg-primary)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-color)'
        }}
        ref={setNodeRef}
        data-column={column.type}
        data-col-key={column.id}
        {...(isDraggable ? attributes : {})}
        {...(isDraggable ? listeners : {})}
      >
        <div className="flex items-center gap-1">
          {isDraggable && (
            <GripVertical className="w-3 h-3" style={{color: 'var(--text-secondary)'}} />
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
          width: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Navigation arrows positioned above the headers */}
        <div 
          className="flex justify-between items-center px-4 py-1 border-b"
          style={{backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)'}}
        >
          {/* Presentation Mode Toggle */}
          <Button
            onClick={togglePresentationMode}
            variant={isPresentationMode ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-1 text-xs"
            style={{
              backgroundColor: isPresentationMode ? 'var(--accent-color)' : 'var(--bg-primary)',
              color: isPresentationMode ? 'var(--bg-primary)' : 'var(--text-primary)',
              borderColor: 'var(--border-color)'
            }}
          >
            {isPresentationMode ? <RotateCcw size={12} /> : <Monitor size={12} />}
            {isPresentationMode ? "Reset" : "Present"}
          </Button>


          <div className="flex-1" />
        </div>

        {/* Column headers with drag and drop support */}
        <SortableContext 
          items={visibleColumns.map(col => col.id)} 
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex">
            {/* Reference header - always sticky left, but moves with centering when content fits */}
            {visibleColumns.filter(col => col.id === 'reference').map((column) => (
              <div
                key={column.id}
                style={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 30,
                  backgroundColor: 'var(--bg-primary)'
                }}
              >
                <SortableHeaderCell column={column} />
              </div>
            ))}
            
            {/* Scrollable headers container - centers when content fits, scrolls when overflow */}
            <div 
              ref={headerRef}
              className="column-headers-inner flex"
              style={{ 
                minWidth: 'fit-content',
                width: 'fit-content',
                margin: isPortrait ? '0' : '0 auto',
                overflowX: 'auto',
                maxWidth: '100%',
                transform: `translateX(-${scrollLeft}px)` // Synchronize with table horizontal scroll
              }}
            >
              {visibleColumns.filter(col => col.id !== 'reference').map((column) => (
                <SortableHeaderCell key={column.id} column={column} />
              ))}
            </div>
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