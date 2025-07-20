import { useMemo } from 'react';
import type { Translation } from '@/types/bible';
import { useTranslationMaps, useColumnKeys } from '@/store/translationSlice';
import { useBibleStore } from '@/App';
import { getVisibleColumns, getColumnWidth, COLUMN_LAYOUT } from '@/constants/columnLayout';

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
}

function HeaderCell({ column, isMain, isMobile }: HeaderCellProps) {
  // Mobile-optimized width logic matching VirtualRow exactly - updated for new slot numbers
  const width = isMobile ? 
    (column.name === "Ref" || column.name === "Reference" ? "w-14" : 
     column.name === "Notes" ? "w-16" :
     column.name === "Cross Refs" || column.name === "Cross References" ? "w-12" : 
     ["P", "F", "V"].includes(column.name) ? "w-8" : "flex-1") :
    (column.name === "Ref" || column.name === "Reference" ? "w-16" : 
     column.name === "Notes" ? "w-64" :
     column.name === "Cross Refs" || column.name === "Cross References" ? "w-60" : 
     ["P", "F", "V"].includes(column.name) ? "w-20" : "w-80");
  const bgClass = isMain ? "bg-blue-100 dark:bg-blue-900" : "bg-background";

  return (
    <div className={`${width} flex-shrink-0 flex items-center justify-center border-r px-1 font-semibold text-xs ${bgClass}`}>
      {column.name}
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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Get store states for column visibility
  const { 
    showCrossRefs: storeShowCrossRefs, 
    showProphecies, 
    showNotes: storeShowNotes, 
    showDates, 
    columnState,
    isInitialized 
  } = useBibleStore();

  // Prevent render if store not initialized
  if (!isInitialized) {
    return null;
  }

  // Use prop if provided, otherwise fall back to store state
  const showCrossRefs = propShowCrossRefs ?? storeShowCrossRefs;
  const showNotes = propShowNotes ?? storeShowNotes;

  // Use store's columnState as the authoritative source, enhanced with translation data
  const slotConfig: Record<number, any> = {};

  // PROPER SLOT ARCHITECTURE according to UI spec docs:
  // Slot 0: Reference (always visible)
  slotConfig[0] = { type: 'reference', header: 'Ref', visible: true };
  
  // Slot 1: Notes (default hidden)
  slotConfig[1] = { type: 'notes', header: 'Notes', visible: showNotes };
  
  // Slot 2: Main translation (always visible)
  slotConfig[2] = { type: 'main-translation', header: main, translationCode: main, visible: true };
  
  // Slot 3: Cross References (per UI spec)
  slotConfig[3] = { type: 'cross-refs', header: 'Cross Refs', visible: showCrossRefs };
  
  // Slot 4: Dates (default hidden)
  slotConfig[4] = { type: 'context', header: 'Dates', visible: showDates };
  
  // Slots 5-16: Alternate translations (per UI spec)
  alternates.forEach((translationCode, index) => {
    const slot = 5 + index; // Alternates start at slot 5
    if (slot <= 16) { // Max 12 alternate translations (slots 5-16)
      slotConfig[slot] = { 
        type: 'alt-translation', 
        header: translationCode, 
        translationCode, 
        visible: true  // Show all active alternate translations
      };
    }
  });
  
  // Slots 17-19: Prophecy P/F/V (per UI spec)
  slotConfig[17] = { type: 'prophecy-p', header: 'P', visible: showProphecies };
  slotConfig[18] = { type: 'prophecy-f', header: 'F', visible: showProphecies };
  slotConfig[19] = { type: 'prophecy-v', header: 'V', visible: showProphecies };

  // Debug logging
  console.log('📋 ColumnHeaders slotConfig:', Object.keys(slotConfig).map(slot => ({ 
    slot: parseInt(slot), 
    type: slotConfig[parseInt(slot)]?.type, 
    header: slotConfig[parseInt(slot)]?.header, 
    visible: slotConfig[parseInt(slot)]?.visible 
  })));

  // Get all visible columns sorted by slot position, matching VirtualRow exactly  
  const visibleColumns = Object.entries(slotConfig)
    .map(([slotStr, config]) => ({
      slot: parseInt(slotStr),
      config,
      name: config?.header || '',
      type: config?.type || '',
      isMain: config?.type === 'main-translation',
      visible: config?.visible !== false
    }))
    .filter(col => col.config && col.visible) // Only render valid, visible slots
    .sort((a, b) => a.slot - b.slot);

  console.log('📋 ColumnHeaders visibleColumns:', visibleColumns.map(col => ({ slot: col.slot, name: col.name, type: col.type, visible: col.visible })));

  // Calculate if we should center based on total column width vs viewport
  const estimatedTotalWidth = useMemo(() => {
    let width = 0;
    width += 80; // Reference column ~80px
    width += 320; // Main translation ~320px
    if (showCrossRefs) width += 240; // Cross refs ~240px
    if (showProphecies) width += 180; // P+F+V ~60px each
    width += (alternates.length * 320); // Alt translations ~320px each
    return width;
  }, [showCrossRefs, showProphecies, alternates]);
  
  // Get viewport width
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  
  // Center only if total width fits in viewport, otherwise left-anchor
  const shouldCenter = estimatedTotalWidth <= viewportWidth * 0.95; // 5% margin

  const allColumns = visibleColumns.map(col => ({
    id: col.config?.header?.toLowerCase().replace(' ', '-') || '',
    name: col.config?.header || '',
    type: col.config?.type || '',
    position: col.slot,
    isMain: col.config?.translationCode === main,
    slot: col.slot
  }));

  // Split columns: reference (sticky) and others (scrollable)
  const referenceColumn = allColumns.find(col => col.slot === 0);
  const otherColumns = allColumns.filter(col => col.slot !== 0);

  return (
    <div 
      className="sticky left-0 right-0 z-30 border-b shadow-sm"
      style={{ 
        top: '38px', // Mobile header height (matches BiblePage header)
        height: '40px',
        backgroundColor: 'var(--header-bg)',
        borderBottomColor: 'var(--border-color)',
        marginTop: '-1px' // Overlap border to eliminate gap
      }}
    >
      <div className="overflow-hidden w-full h-full flex">
        {shouldCenter ? (
          // Centered layout for few columns
          <div className="flex justify-center w-full h-full">
            <div className="flex min-w-max h-full">
              {allColumns.map((column) => (
                <HeaderCell
                  key={`slot-${column.slot}`}
                  column={column}
                  isMain={column.isMain}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        ) : (
          // Left-anchored layout - simple layout without sticky positioning
          <div className="flex min-w-max h-full">
            <div 
              className="flex min-w-max h-full"
              style={{ 
                transform: `translateX(-${Math.round(scrollLeft)}px)`,
                willChange: 'transform'
              }}
            >
              {allColumns.map((column) => (
                <HeaderCell
                  key={`slot-${column.slot}`}
                  column={column}
                  isMain={column.isMain}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}