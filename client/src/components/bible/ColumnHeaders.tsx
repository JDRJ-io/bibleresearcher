
import { useMemo } from 'react';
import type { Translation } from '@/types/bible';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { useBibleStore } from '@/App';
import { createSlotConfig, getVisibleColumns } from '@/constants/slotConfig';

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
  try {
    console.log('🔍 ColumnHeaders DEBUG:', {
      selectedTranslations: selectedTranslations ? selectedTranslations.length : 'NULL',
      propShowNotes: typeof propShowNotes,
      showProphecy: typeof showProphecy,
      propShowCrossRefs: typeof propShowCrossRefs,
      showContext: typeof showContext,
      scrollLeft: typeof scrollLeft,
      preferences: preferences ? 'EXISTS' : 'NULL'
    });

    const { main, alternates } = useTranslationMaps();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    console.log('🔍 ColumnHeaders Translation Data:', {
      main: typeof main,
      mainValue: main,
      alternates: alternates ? alternates.length : 'NULL'
    });

    // Get store states for column visibility with safety checks
    const store = useBibleStore();
    
    if (!store) {
      console.error('❌ ColumnHeaders: Store not available');
      return <div className="h-10 bg-gray-100">Loading headers...</div>;
    }

  const { 
    showCrossRefs: storeShowCrossRefs = true, 
    showProphecies = false, 
    showNotes: storeShowNotes = false, 
    showDates = false, 
    columnState,
    isInitialized = false
  } = store;

  // Use prop if provided, otherwise fall back to store state
  const showCrossRefs = propShowCrossRefs ?? storeShowCrossRefs;
  const showNotes = propShowNotes ?? storeShowNotes;

  // Ensure we have valid translation data
  const mainTranslation = main || 'KJV';
  const alternateTranslations = alternates || [];

  // Use centralized slot configuration - single source of truth
  const slotConfig = createSlotConfig(
    mainTranslation,
    alternateTranslations,
    showCrossRefs,
    showProphecies,
    showNotes,
    showDates
  );

  // Debug logging
  console.log('📋 ColumnHeaders slotConfig:', Object.keys(slotConfig).map(slot => ({ 
    slot: parseInt(slot), 
    type: slotConfig[parseInt(slot)]?.type, 
    header: slotConfig[parseInt(slot)]?.header, 
    visible: slotConfig[parseInt(slot)]?.visible 
  })));

  // Use centralized visible columns helper - matching VirtualRow exactly
  const visibleColumns = getVisibleColumns(slotConfig).map(({ slot, config }) => ({
    slot,
    config,
    name: config?.header || '',
    type: config?.type || '',
    isMain: config?.type === 'main-translation',
    visible: config?.visible !== false
  }));

  console.log('📋 ColumnHeaders visibleColumns:', visibleColumns.map(col => ({ slot: col.slot, name: col.name, type: col.type, visible: col.visible })));

  // Calculate if we should center based on total column width vs viewport
  const estimatedTotalWidth = useMemo(() => {
    let width = 0;
    width += 80; // Reference column ~80px
    width += 320; // Main translation ~320px
    if (showCrossRefs) width += 240; // Cross refs ~240px
    if (showProphecies) width += 180; // P+F+V ~60px each
    width += (alternateTranslations.length * 320); // Alt translations ~320px each
    return width;
  }, [showCrossRefs, showProphecies, alternateTranslations]);

  // Get viewport width
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

  // Center only if total width fits in viewport, otherwise left-anchor
  const shouldCenter = estimatedTotalWidth <= viewportWidth * 0.95; // 5% margin

  const allColumns = visibleColumns.map(col => ({
    id: col.config?.header?.toLowerCase().replace(' ', '-') || `slot-${col.slot}`,
    name: col.config?.header || `Column ${col.slot}`,
    type: col.config?.type || 'unknown',
    position: col.slot,
    isMain: col.config?.translationCode === mainTranslation,
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
  } catch (error) {
    console.error('🚨 ColumnHeaders CRASH DEBUG:', {
      error: error.message,
      stack: error.stack,
      main,
      alternates,
      store: store ? 'EXISTS' : 'NULL'
    });
    return (
      <div className="h-10 bg-red-50 border border-red-200 flex items-center justify-center">
        <div className="text-red-600 text-xs">HEADER ERROR: {error.message}</div>
      </div>
    );
  }
}
