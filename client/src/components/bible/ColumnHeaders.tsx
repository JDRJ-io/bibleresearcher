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

  // Always show reference column (slot 0)
  slotConfig[0] = { type: 'reference', header: 'Ref', visible: true };
  
  // Always show main translation (slot 2 per UI spec)  
  slotConfig[2] = { type: 'main-translation', header: main, translationCode: main, visible: true };

  // Map all column types based on store state - following UI layout spec
  columnState.columns.forEach(col => {
    switch (col.slot) {
      case 1:
        // Notes column (slot 1 per UI spec)
        slotConfig[1] = { type: 'notes', header: 'Notes', visible: showNotes };
        break;
      case 3:
        // Cross References column (slot 3 per UI spec)
        slotConfig[3] = { type: 'cross-refs', header: 'Cross References', visible: col.visible && showCrossRefs };
        break;
      case 4:
        // Dates column (slot 4 per UI spec)
        slotConfig[4] = { type: 'context', header: 'Dates', visible: col.visible && showDates };
        break;
      case 17:
        // Prophecy P column (slot 17 per UI spec)
        slotConfig[17] = { type: 'prophecy-p', header: 'P', visible: col.visible && showProphecies };
        break;
      case 18:
        // Prophecy F column (slot 18 per UI spec)
        slotConfig[18] = { type: 'prophecy-f', header: 'F', visible: col.visible && showProphecies };
        break;
      case 19:
        // Prophecy V column (slot 19 per UI spec)
        slotConfig[19] = { type: 'prophecy-v', header: 'V', visible: col.visible && showProphecies };
        break;
    }
  });

  // Ensure Notes column is always in slotConfig when showNotes is true
  if (showNotes && !slotConfig[1]) {
    slotConfig[1] = { type: 'notes', header: 'Notes', visible: true };
  }

  // Dynamically add alternate translation columns to slots 5-16 per UI spec
  alternates.forEach((translationCode, index) => {
    const slot = 5 + index; // Start at slot 5 for alternates per UI spec
    if (slot <= 16) { // Max 12 alternate translations (slots 5-16)
      slotConfig[slot] = { 
        type: 'alt-translation', 
        header: translationCode, 
        translationCode, 
        visible: true  // Show all active alternate translations
      };
    }
  });

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

  // Centering rule from UI_layout_spec.md: center when visibleColumns <= 3
  const shouldCenter = visibleColumns.length <= 3;

  const allColumns = visibleColumns.map(col => ({
    id: col.config?.header?.toLowerCase().replace(' ', '-') || '',
    name: col.config?.header || '',
    type: col.config?.type || '',
    position: col.slot,
    isMain: col.config?.translationCode === main,
    slot: col.slot
  }));

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
      <div className="overflow-hidden w-full h-full">
        <div className={shouldCenter ? "flex justify-center w-full h-full" : ""}>
          <div 
            className="flex min-w-max h-full"
            style={{ 
              transform: shouldCenter ? undefined : `translateX(-${Math.round(scrollLeft)}px)`,
              willChange: shouldCenter ? undefined : 'transform'
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
      </div>
    </div>
  );
}