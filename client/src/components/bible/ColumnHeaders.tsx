import { useMemo, useState, useEffect } from 'react';
import type { Translation } from '@/types/bible';
import { useTranslationMaps, useColumnKeys } from '@/store/translationSlice';
import { useBibleStore } from '@/App';
import { getVisibleColumns, getColumnWidth, COLUMN_LAYOUT } from '@/constants/columnLayout';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColumnHeadersProps {
  selectedTranslations: Translation[];
  showNotes: boolean;
  showProphecy: boolean;
  showCrossRefs?: boolean;
  showContext: boolean;
  scrollLeft: number;
  preferences: any;
  isGuest?: boolean;
}

interface HeaderCellProps {
  column: any;
  isMain?: boolean;
  isMobile?: boolean;
  isDraggable?: boolean;
  columnState: any;
}

function SortableHeaderCell({ column, isMain, isMobile, isDraggable, columnState }: HeaderCellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `column-${column.slot}`,
    disabled: !isDraggable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isDraggable ? listeners : {})}
      className={isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
    >
      <HeaderCell 
        column={column} 
        isMain={isMain} 
        isMobile={isMobile} 
        isDraggable={isDraggable}
        columnState={columnState}
      />
    </div>
  );
}

function HeaderCell({ column, isMain, isMobile, isDraggable, columnState }: HeaderCellProps) {
  const responsiveConfig = useResponsiveColumns();

  // CRITICAL FIX: Use IDENTICAL width logic as VirtualRow - no more mismatches
  const getResponsiveSlotWidth = (columnState: any, slot: number): string => {
    const isPortrait = window.innerHeight > window.innerWidth;

    // IDENTICAL LOGIC TO VirtualRow.tsx getResponsiveColumnPixelWidth()
    if (isPortrait) {
      // Portrait mode - use adaptive CSS variables (EXACTLY same as VirtualRow)
      if (slot === 0) return 'var(--adaptive-ref-width)';
      if (slot === 3 && column.type === 'main-translation') return 'var(--adaptive-main-width)';
      if (slot === 7 && column.type === 'cross-refs') return 'var(--adaptive-cross-width)';
      if (column.type === 'alt-translation') return 'var(--adaptive-alt-width)';
      if (column.type === 'prophecy-p' || column.type === 'prophecy-f' || column.type === 'prophecy-v') return 'var(--adaptive-prophecy-width)';
      if (column.type === 'notes') return 'var(--adaptive-notes-width)';
      if (column.type === 'context') return 'var(--adaptive-context-width)';
      return 'var(--adaptive-alt-width)';
    } else {
      // Landscape mode - use unified variables (EXACTLY same as VirtualRow)
      if (slot === 0) return 'var(--ref-col-width)';
      if (slot === 3) return 'var(--main-col-width)';
      if (slot === 7) return 'var(--xref-col-width)';
      if (column.type === 'alt-translation') return 'var(--alt-col-width)';
      if (column.type === 'prophecy-p' || column.type === 'prophecy-f' || column.type === 'prophecy-v') return 'var(--prophecy-col-width)';
      if (column.type === 'notes') return 'var(--alt-col-width)';
      if (column.type === 'context') return 'calc(12rem * var(--column-width-mult))';
      return 'var(--alt-col-width)';
    }
  };

  const bgClass = isMain ? "bg-blue-100 dark:bg-blue-900" : "bg-background";

  // Enhanced text styling for reference column
  const textClass = (column.name === "Ref" || column.name === "Reference" || column.name === "#") 
    ? "font-bold text-sm" // Bigger, bolder text for reference header
    : "font-bold text-xs";

  // Add visual indicator for draggable mode
  const draggableClass = isDraggable ? "border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-950" : "";

  const calculatedWidth = getResponsiveSlotWidth(columnState, column.slot);

  // Determine data-column attribute for CSS synchronization
  const getDataColumn = () => {
    if (column.type === 'reference') return 'reference';
    if (column.type === 'main-translation') return 'main';
    if (column.type === 'cross-refs') return 'cross-refs';
    if (column.type === 'alt-translation') return 'alt-translation';
    if (column.type === 'notes') return 'notes';
    if (column.type === 'context') return 'context';
    if (column.type === 'prophecy-p' || column.type === 'prophecy-f' || column.type === 'prophecy-v') return 'prophecy';
    return column.type;
  };

  return (
    <div 
      className={`column-header-cell bible-column flex-shrink-0 flex items-center justify-center border-r px-1 ${textClass} leading-none ${bgClass} ${draggableClass} relative`}
      data-column={getDataColumn()}
      style={{
        width: calculatedWidth, // Unified variables already include multiplier
        minWidth: calculatedWidth
      }}
    >
      {isDraggable && (
        <div className="absolute top-0 right-0 text-blue-500 text-xs">⋮⋮</div>
      )}
      {isMobile && (column.name === "Ref" || column.name === "Reference") ? "#" : 
       isMobile && column.name === "Dates" ? (
         <div className="text-[8px] font-semibold text-center leading-none px-0" style={{ fontSize: '8px', lineHeight: '1' }}>
           D
         </div>
       ) : column.name}
    </div>
  );
}

// Step 4.3-a. ColumnHeaders with slot-based system
export function ColumnHeaders({ 
  selectedTranslations, 
  showNotes: propShowNotes, 
  showProphecy, 
  showCrossRefs: propShowCrossRefs,
  showContext, 
  scrollLeft, 
  preferences, 
  isGuest = true 
}: ColumnHeadersProps) {
  const { main, alternates } = useTranslationMaps();
  const responsiveConfig = useResponsiveColumns();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Make headers adaptive to screen size changes
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 768);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const adaptiveIsMobile = screenWidth < 768;

  // Get store states for column visibility and unlock mode
  const { 
    showCrossRefs: storeShowCrossRefs, 
    showProphecies, 
    showNotes: storeShowNotes, 
    showDates, 
    columnState,
    isInitialized,
    unlockMode
  } = useBibleStore();

  // Use prop if provided, otherwise fall back to store state
  const showCrossRefs = propShowCrossRefs ?? storeShowCrossRefs;
  const showNotes = propShowNotes ?? storeShowNotes;

  // Prevent render if store not initialized
  if (!isInitialized) {
    console.log('⚠️ ColumnHeaders: Store not initialized, skipping render');
    return null;
  }

  console.log('📋 ColumnHeaders render state:', { 
    isInitialized, 
    showCrossRefs, 
    showProphecies, 
    showNotes,
    main,
    alternates: alternates.length
  });

  // Use store's columnState as the authoritative source, enhanced with translation data
  const slotConfig: Record<number, any> = {};

  // Always show reference column (slot 0)
  slotConfig[0] = { type: 'reference', header: 'Ref', visible: true };

  // Dates column right after reference (slot 1)
  slotConfig[1] = { type: 'context', header: 'Dates', visible: showDates };

  // Notes column moved to slot 2 (right after dates)
  slotConfig[2] = { type: 'notes', header: 'Notes', visible: showNotes };

  // Main translation moved to slot 3
  slotConfig[3] = { type: 'main-translation', header: main || 'KJV', translationCode: main || 'KJV', visible: true };

  // Map all column types based on store state - updated slot assignments
  if (columnState?.columns) {
    columnState.columns.forEach(col => {
    switch (col.slot) {
      case 1:
        // Dates column (moved to slot 1 after Ref)
        slotConfig[1] = { type: 'context', header: 'Dates', visible: col.visible && showDates };
        break;
      case 2:
        // Notes column (moved to slot 2)
        slotConfig[2] = { type: 'notes', header: 'Notes', visible: col.visible && showNotes };
        break;
      case 3:
        // Main translation (moved to slot 3)
        slotConfig[3] = { type: 'main-translation', header: main || 'KJV', translationCode: main || 'KJV', visible: true };
        break;
      case 7:
        // Cross References column (unchanged)
        slotConfig[7] = { type: 'cross-refs', header: 'Cross Refs', visible: col.visible && showCrossRefs };
        break;
      case 8:
        // Prophecy Prediction column (unchanged)
        slotConfig[8] = { type: 'prophecy-p', header: 'Prediction', visible: showProphecies };
        break;
      case 9:
        // Prophecy Fulfillment column (unchanged)
        slotConfig[9] = { type: 'prophecy-f', header: 'Fulfillment', visible: showProphecies };
        break;
      case 10:
        // Prophecy Verification column (unchanged)
        slotConfig[10] = { type: 'prophecy-v', header: 'Verification', visible: showProphecies };
        break;
    }
    });
  }

  // Dynamically add alternate translation columns to slots 12-19 for 8 total alternates
  // NOW AVAILABLE ON MOBILE with horizontal scrolling
  // FILTER OUT main translation to prevent duplication
  alternates
    .filter(translationCode => translationCode !== main) // Prevent main translation duplication
    .forEach((translationCode, index) => {
      // All alternate translations start from slot 12 (AFTER cross-references)
      const slot = 12 + index;

      if (slot <= 19) { // Max 8 alternate translations total starting from slot 12
        slotConfig[slot] = { 
          type: 'alt-translation', 
          header: translationCode, 
          translationCode, 
          visible: true  // Show all active alternate translations
        };
      }
    });

  // Debug logging
  console.log('📋 ColumnHeaders slotConfig:', Object.keys(slotConfig).map(slot => ({ 
    slot: parseInt(slot), 
    type: slotConfig[parseInt(slot)]?.type, 
    header: slotConfig[parseInt(slot)]?.header, 
    visible: slotConfig[parseInt(slot)]?.visible 
  })));

  // Build visible columns directly from our state
  const visibleColumns = useMemo(() => {
    const columns = [];

    // Always add reference column
    columns.push({
      slot: 0,
      type: 'reference',
      name: 'Ref',
      visible: true,
      isMain: false
    });

    // Add dates column if visible (right after reference)
    if (slotConfig[1]?.visible) {
      columns.push({
        slot: 1,
        type: 'context',
        name: 'Dates',
        visible: true,
        isMain: false
      });
    }

    // Add notes column if visible (right after dates)
    if (slotConfig[2]?.visible) {
      columns.push({
        slot: 2,
        type: 'notes',
        name: 'Notes',
        visible: true,
        isMain: false
      });
    }

    // Always add main translation (after notes)
    columns.push({
      slot: 3,
      type: 'main-translation',
      name: main || 'KJV',
      visible: true,
      isMain: true
    });

    // Add alternate translations from slotConfig (supports both slots 3-6 and 12-19)
    // Available on all devices with horizontal scrolling
    // Skip slot 3 since we already added main translation there
    Object.entries(slotConfig).forEach(([slotStr, config]) => {
      const slot = parseInt(slotStr);
      if (config?.type === 'alt-translation' && config?.visible && slot !== 3) {
        columns.push({
          slot,
          type: 'alt-translation',
          name: config.header,
          visible: true,
          isMain: false
        });
      }
    });

    // Add all other feature columns from slotConfig (excluding main translation which we already added)
    Object.entries(slotConfig).forEach(([slotStr, config]) => {
      const slot = parseInt(slotStr);
      if (config?.visible && slot > 2 && slot !== 3 && config?.type !== 'alt-translation' && config?.type !== 'main-translation') {
        columns.push({
          slot,
          type: config.type,
          name: config.header,
          visible: true,
          isMain: false
        });
      }
    });

    // Sort columns by displayOrder from store if available
    if (columnState?.columns) {
      const slotToDisplayOrder = new Map();
      columnState.columns.forEach(col => {
        if (col.visible) {
          slotToDisplayOrder.set(col.slot, col.displayOrder);
        }
      });

      // Add displayOrder to each column and sort
      columns.forEach((col: any) => {
        col.displayOrder = slotToDisplayOrder.get(col.slot) ?? col.slot;
      });

      columns.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
    } else {
      // Fallback to slot-based sorting
      columns.sort((a, b) => a.slot - b.slot);
    }

    // FORCE custom mobile ordering: Reference → Main Translation → Cross References → Alternate Translations
    console.log('🔧 BEFORE MOBILE ORDERING - adaptiveIsMobile:', adaptiveIsMobile, 'columns:', columns.map(c => ({ slot: c.slot, type: c.type, name: c.name })));

    if (adaptiveIsMobile) {
      columns.sort((a, b) => {
        const order: Record<string, number> = { 
          'reference': 0, 
          'context': 1,
          'notes': 2,       // Notes come right after dates
          'main-translation': 3, 
          'cross-refs': 4, 
          'alt-translation': 5,
          'prophecy-p': 6,
          'prophecy-f': 7,
          'prophecy-v': 8
        };
        const aOrder = order[a.type] ?? 9;
        const bOrder = order[b.type] ?? 9;

        // If same type, sort by slot number for alternate translations
        if (aOrder === bOrder && a.type === 'alt-translation') {
          return a.slot - b.slot;
        }

        return aOrder - bOrder;
      });

      console.log('📱 AFTER MOBILE ORDERING:', columns.map(c => ({ slot: c.slot, type: c.type, name: c.name })));
    } else {
      console.log('🖥️ DESKTOP MODE - no mobile ordering applied');
    }

    // Remove any duplicate slots to prevent React key errors
    const uniqueColumns = [];
    const seenSlots = new Set();

    for (const column of columns) {
      if (!seenSlots.has(column.slot)) {
        seenSlots.add(column.slot);
        uniqueColumns.push(column);
      } else {
        console.warn(`🚨 Duplicate slot detected: ${column.slot} (${column.name}), skipping duplicate`);
      }
    }

    return uniqueColumns;
  }, [showCrossRefs, showProphecies, showNotes, showDates, main, alternates, adaptiveIsMobile, columnState]);

  console.log('📋 ColumnHeaders visibleColumns:', visibleColumns.map(col => ({ slot: col.slot, name: col.name, type: col.type, visible: col.visible })));

  // Calculate actual total width from columnState for accurate measurement
  const actualTotalWidth = useMemo(() => {
    if (!columnState?.columns) return 0;

    // For mobile, calculate width based on our mobile width logic
    if (adaptiveIsMobile) {
      const viewportWidth = window.innerWidth;
      const safeWidth = viewportWidth - 40;

      return visibleColumns.reduce((total, col) => {
        if (col.slot === 0) return total + 32; // Reference
        if (col.slot === 3 && col.type === 'main-translation') return total + Math.floor(safeWidth * 0.30);
        if (col.slot === 7 && col.type === 'cross-refs') return total + Math.floor(safeWidth * 0.25);
        if (col.type === 'alt-translation') return total + Math.floor(safeWidth * 0.35); // Alternate translations
        if (col.type === 'notes') return total + 80;
        if (col.type === 'prophecy-p' || col.type === 'prophecy-f' || col.type === 'prophecy-v') return total + 64;
        if (col.type === 'context') return total + 80;
        return total + 120; // fallback
      }, 0);
    }

    // Desktop calculation
    return visibleColumns.reduce((total, col) => {
      const columnInfo = columnState.columns.find(c => c.slot === col.slot);
      if (columnInfo) {
        // Convert rem to pixels (1rem = 16px)
        return total + (columnInfo.widthRem * 16);
      }
      return total + 160; // fallback width
    }, 0);
  }, [visibleColumns, columnState, adaptiveIsMobile]);

  // Get viewport width
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

  // FIXED COLUMN WIDTHS: Never compress columns, always use horizontal scroll
  // Only center when content genuinely fits without compression
  const shouldCenter = !adaptiveIsMobile && actualTotalWidth <= viewportWidth * 0.95;
  const needsHorizontalScroll = actualTotalWidth > viewportWidth;

  const allColumns = visibleColumns.map(col => ({
    id: col.name.toLowerCase().replace(/\s+/g, '-'),
    name: col.name,
    type: col.type,
    position: col.slot,
    isMain: col.isMain,
    slot: col.slot
  }));

  // Split columns: reference (sticky) and others (scrollable)
  const referenceColumn = allColumns.find(col => col.slot === 0);
  const otherColumns = allColumns.filter(col => col.slot !== 0);

  const topHeaderHeight = '64px'; // Same height for both mobile and desktop

  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Extract slot numbers from drag IDs
    const activeSlot = parseInt((active.id as string).replace('column-', ''));
    const overSlot = parseInt((over.id as string).replace('column-', ''));

    console.log(`🔄 Reordering columns: slot ${activeSlot} → slot ${overSlot}`);

    // Call the store's reorder function
    columnState.reorder(activeSlot, overSlot);
  };

  // Create sortable column IDs for DndContext
  const sortableItems = allColumns.map(col => `column-${col.slot}`);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div 
        className={`column-headers-container sticky z-40 bg-background border-b shadow-sm ${unlockMode ? 'ring-2 ring-blue-400' : ''}`}
        style={{ 
          left: -scrollLeft,  // keep horizontal sync only
          width: '100%',
          height: 'var(--column-header-height)',
          minHeight: 'var(--column-header-height)',
          position: 'sticky',
          zIndex: 40
        }}
        onWheel={(e) => {
          // Prevent wheel events from affecting this element's position
          e.stopPropagation();
        }}
        onScroll={(e) => {
          // Prevent scroll events from affecting this element's position
          e.stopPropagation();
        }}
      >
        <div className="w-full h-full" style={{ overflowX: needsHorizontalScroll ? 'auto' : 'hidden' }}>
          <SortableContext items={sortableItems} strategy={horizontalListSortingStrategy}>
            {shouldCenter ? (
              // Centered layout for few columns - FIXED WIDTHS
              <div className="flex justify-center w-full h-full">
                <div className="flex" style={{ minWidth: `${actualTotalWidth}px` }}>
                  {allColumns.map((column) => (
                    <SortableHeaderCell
                      key={`slot-${column.slot}`}
                      column={column}
                      isMain={column.isMain}
                      isMobile={adaptiveIsMobile}
                      isDraggable={unlockMode}
                      columnState={columnState}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // Left-anchored layout with FIXED WIDTHS and horizontal scroll
              <div className="flex h-full" style={{ minWidth: `${actualTotalWidth}px`, width: `${actualTotalWidth}px` }}>
                <div 
                  className="flex h-full"
                  style={{ 
                    minWidth: 'max-content',
                    width: 'max-content',
                    transform: `translateX(-${Math.round(scrollLeft)}px)`,
                    willChange: 'transform'
                  }}
                >
                  {allColumns.map((column) => (
                    <SortableHeaderCell
                      key={`slot-${column.slot}`}
                      column={column}
                      isMain={column.isMain}
                      isMobile={adaptiveIsMobile}
                      isDraggable={unlockMode}
                      columnState={columnState}
                    />
                  ))}
                </div>
              </div>
            )}
          </SortableContext>
        </div>
      </div>
    </DndContext>
  );
}