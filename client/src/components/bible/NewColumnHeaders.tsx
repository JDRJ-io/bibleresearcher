import { useMemo, useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { flushSync } from 'react-dom';
import { logger } from '@/lib/logger';
import type { Translation } from '@/types/bible';
import { useTranslationMaps } from '@/store/translationSlice';
import { useBibleStore } from '@/App';
import { useAdaptivePortraitColumns } from '@/hooks/useAdaptivePortraitColumns';
import { useColumnAlignmentStateMachine } from '@/hooks/useColumnAlignmentStateMachine';
import { useMeasuredColumnViewport } from '@/hooks/useMeasuredColumnViewport';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePreventScrollPropagation } from '@/hooks/usePreventScrollPropagation';
import { Button } from '@/components/ui/button';
import { Monitor, RotateCcw, Settings } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { useMasterColumnStore, MASTER_COLUMN_SECTIONS, type MasterColumnSectionId } from '@/stores/masterColumnStore';
import { useMasterMenuUI } from '@/stores/uiMasterMenu';
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

// ── STABLE EMPTY REFS (prevents per-render object creation) ─────────────────────
const EMPTY_OBJ = Object.freeze({});
const EMPTY_ARR = Object.freeze([]) as readonly unknown[];

interface NewColumnHeadersProps {
  selectedTranslations: Translation[];
  showNotes: boolean;
  showCrossRefs?: boolean;
  showDates?: boolean;
  scrollLeft: number;
  preferences: any;
  isGuest?: boolean;
  bodyRef?: React.RefObject<HTMLElement>;
  // Centering info for proper reference header alignment
  isCentered?: boolean;
  actualTotalWidth?: number;
  viewportWidth?: number;
}

interface SimpleColumn {
  id: string;
  name: string;
  type: 'reference' | 'main-translation' | 'alt-translation' | 'cross-refs' | 'notes' | 'context' | 'prophecy' | 'hybrid';
  visible: boolean;
  width: string;
  slot: number;
  isNavigable: boolean;
}

export function NewColumnHeaders({ 
  selectedTranslations, 
  showNotes: propShowNotes, 
  showCrossRefs = false,
  showDates = false,
  scrollLeft, 
  preferences, 
  isGuest = true,
  bodyRef,
  isCentered = false,
  actualTotalWidth = 0,
  viewportWidth = 0
}: NewColumnHeadersProps) {
  
  const { main, alternates } = useTranslationMaps();

  // Track alternate translation changes (logging removed for performance) - per-field selectors
  const isInitialized = useBibleStore(s => s.isInitialized);
  const storeShowNotes = useBibleStore(s => s.showNotes);
  const showHybrid = useBibleStore(s => s.showHybrid);
  const unlockMode = useBibleStore(s => s.unlockMode);
  const showProphecy = useBibleStore(s => s.showProphecies);
  const translations = useBibleStore(s => s.translations);
  const crossRefs = useBibleStore(s => s.crossRefs);
  const prophecyData = useBibleStore(s => s.prophecyData);
  const columnState = useBibleStore(s => s.columnState);
  const reorder = useBibleStore(s => s.columnState.reorder);

  // Active columns cache management (prevents setState during render)
  const recomputeActiveColumns = useBibleStore(s => s.recomputeActiveColumns);
  const buildActiveColumnsPure = useBibleStore(s => s.buildActiveColumnsPure);

  // Master column settings
  const { sectionVisibility, toggleSection, resetToDefaults } = useMasterColumnStore();

  // Use the live store state instead of preferences for notes visibility
  const showNotes = storeShowNotes;

  // Create refs for scroll navigation
  const headerRef = useRef<HTMLDivElement>(null);
  // bodyRef is passed in from props
  
  // Prevent scroll propagation to underlying table (fixes mobile portrait scroll issues)
  usePreventScrollPropagation(headerRef, {
    allowInternalScroll: true,
    preventWheel: true,
    preventTouch: true
  });
  
  // STATE MACHINE: Intelligent alignment control - coordinate with VirtualBibleTable body
  const alignmentState = useColumnAlignmentStateMachine(headerRef);
  
  // Mobile and orientation detection
  // MOBILE-AWARE LAYOUT: Treat mobile landscape same as mobile portrait
  const isMobile = useIsMobile();
  const isPortrait = window.innerHeight > window.innerWidth;
  const shouldDisableDragAndDrop = isMobile; // Disable drag-and-drop for ALL mobile devices (portrait and landscape)
  
  // Use measurement hook for DOM-based viewport navigation
  const { visibleNavCount, scrollLeftOne, scrollRightOne, canScrollLeft, canScrollRight, firstVisNavSlot } = useMeasuredColumnViewport({
    headerRef,
    bodyRef,
    dependencyKey: `${Object.keys(columnState).length}-${JSON.stringify(columnState)}`
  });
  
  // CRITICAL FIX: Sync measured viewport capacity to store for state machine
  const setVisibleNavigableCount = useBibleStore(s => s.setVisibleNavigableCount);
  
  // Manual trigger when refs are available - with delay for DOM rendering
  useEffect(() => {
    const attemptCalculation = () => {
      logger.debug("COL", '🔍 ATTEMPTING MANUAL CALCULATION:', { hasHeaderRef: !!headerRef.current });
      
      if (headerRef.current) {
        logger.debug("COL", '🎯 HEADER REF NOW AVAILABLE - MANUAL CALCULATION!');
        
        // Get actual widths from CSS variables including column width multiplier
        const computedStyle = getComputedStyle(document.documentElement);
        const refWidth = parseInt(computedStyle.getPropertyValue('--adaptive-ref-width') || '72');
        const mainWidth = parseInt(computedStyle.getPropertyValue('--adaptive-main-width') || '320');
        const altWidth = parseInt(computedStyle.getPropertyValue('--adaptive-alt-width') || '320');
        const notesWidth = parseInt(computedStyle.getPropertyValue('--adaptive-notes-width') || '320');
        const crossWidth = parseInt(computedStyle.getPropertyValue('--adaptive-cross-width') || '320');
        const prophecyWidth = parseInt(computedStyle.getPropertyValue('--adaptive-prophecy-width') || '360');
        const contextWidth = parseInt(computedStyle.getPropertyValue('--adaptive-context-width') || '400');
        const multiplier = parseFloat(computedStyle.getPropertyValue('--column-width-mult') || '1');
        
        const headerWidth = headerRef.current.clientWidth || 0;
        
        // CRITICAL FIX: Account for hybrid/master column width when visible
        const hybridColumn = columns.find(col => col.type === 'hybrid');
        const hybridWidth = hybridColumn ? parseInt(computedStyle.getPropertyValue('--adaptive-main-width') || '400') * multiplier : 0;
        
        // Subtract both reference and hybrid column widths from available space
        const availableWidth = headerWidth - refWidth - hybridWidth;
        const estimatedFit = Math.floor(availableWidth / (320 * multiplier)); // Account for multiplier
        
        // Count actual navigable columns that are currently active
        const actualNavigableCount = columns.filter(col => col.isNavigable).length;
        const calculatedCount = Math.max(1, Math.min(estimatedFit, actualNavigableCount)); // Cap at actual navigable columns
        
        logger.debug("COL", '📊 MANUAL VIEWPORT CALCULATION:', {
          headerWidth,
          refWidth,
          hybridWidth,
          hybridVisible: !!hybridColumn,
          availableWidth,
          estimatedFit,
          actualNavigableCount,
          calculatedCount,
          willSync: calculatedCount > 1
        });
        
        // Always sync to store, even if count is 1
        setVisibleNavigableCount(calculatedCount);
        logger.debug("COL", '📏 MANUAL SYNC TO STORE:', { value: calculatedCount });
        
        // Dispatch a custom event to notify VirtualBibleTable to recalculate alignment
        window.dispatchEvent(new CustomEvent('column-viewport-measured', {
          detail: { visibleNavigableCount: calculatedCount }
        }));
        
        return true; // Success
      }
      return false; // Failed
    };

    // Try immediately
    if (!attemptCalculation()) {
      // If failed, try again after DOM renders
      const timeoutId = setTimeout(() => {
        if (!attemptCalculation()) {
          // Try one more time after a longer delay
          setTimeout(attemptCalculation, 500);
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [setVisibleNavigableCount]);
  
  useEffect(() => {
    if (visibleNavCount !== undefined && visibleNavCount > 0) {
      setVisibleNavigableCount(visibleNavCount);
      logger.debug("COL", '📏 SYNCING VIEWPORT CAPACITY TO STORE:', {
        measuredValue: visibleNavCount
      });
    }
  }, [visibleNavCount]); // Only depend on visibleNavCount, not the setter

  // Note: Header→body sync is handled by the measurement hook's syncBody function

  // Use the same adaptive widths system as VirtualRow
  const { adaptiveWidths: hookAdaptiveWidths } = useAdaptivePortraitColumns();

  // 🎯 Recompute active columns cache OUTSIDE render (in effect)
  // FIX: Don't put raw arrays/objects in useMemo deps - they create new references every render!
  // Instead, create the JSON string directly without useMemo since JSON.stringify is cheap
  const depsKey = JSON.stringify({
    main: main ?? '',
    alternates: (alternates ?? EMPTY_ARR),
    flags: { showNotes, showCrossRefs, showHybrid, showProphecy },
    widthsKeys: Object.keys(hookAdaptiveWidths ?? EMPTY_OBJ),
    transCount: Object.keys(translations ?? EMPTY_OBJ).length,
    cfCount: Object.keys(crossRefs ?? EMPTY_OBJ).length,
    prophCount: Object.keys(prophecyData ?? EMPTY_OBJ).length,
  });

  // Recompute cache OUTSIDE render when deps change
  useEffect(() => {
    recomputeActiveColumns(depsKey, () => buildActiveColumnsPure());
  }, [
    depsKey,
    recomputeActiveColumns,
    buildActiveColumnsPure
  ]);

  // Custom hook to track CSS variable changes for column width multiplier
  const [columnWidthMult, setColumnWidthMult] = useState(1);
  
  // Force update hook to trigger re-renders
  const [, forceUpdate] = useReducer(x => x + 1, 0);

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
      
      logger.debug('COL', 'column width multiplier from CSS', { numericMult, currentState: columnWidthMult });
      
      if (Math.abs(numericMult - columnWidthMult) > 0.01) {
        logger.debug('COL', 'updating columnWidthMult', { from: columnWidthMult, to: numericMult });
        setColumnWidthMult(numericMult);
      }
    };

    // Function to handle column width changes from adaptive columns
    const handleColumnWidthChange = (event: CustomEvent) => {
      logger.debug("COL", '🔄 NewColumnHeaders: Received adaptive width change signal');
      // Only update if the multiplier has actually changed
      updateColumnWidthMult();
    };

    // Set initial value only once
    updateColumnWidthMult();

    // Listen for adaptive width changes
    window.addEventListener('columnWidthChange', handleColumnWidthChange as EventListener);

    // Listen for manual size controller changes
    const handleManualSizeChange = () => {
      updateColumnWidthMult();
    };
    window.addEventListener('manualSizeChange', handleManualSizeChange);

    return () => {
      window.removeEventListener('columnWidthChange', handleColumnWidthChange as EventListener);
      window.removeEventListener('manualSizeChange', handleManualSizeChange);
    };
  }, []); // Empty deps - only run once on mount, event handlers will update state when needed

  // Headers and body now move together using the working viewport methods!

  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localColumns, setLocalColumns] = useState<SimpleColumn[]>([]);
  

  // Configure sensors for drag and drop - always provide sensors but disable activation in mobile portrait
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: shouldDisableDragAndDrop ? { distance: 99999 } : { distance: 10 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Don't render until store is ready
  if (!isInitialized) {
    return null;
  }

  // Function to get responsive width using CSS calc() expressions for dynamic scaling
  // This allows headers to respond to CSS variable changes without fixed pixel calculations
  const getResponsiveWidth = (columnType: string): string => {
    // Map column types to their corresponding CSS variable names
    let adaptiveVar: string;
    
    switch (columnType) {
      case 'reference':
        adaptiveVar = '--adaptive-ref-width';
        break;
      case 'main-translation':
        adaptiveVar = '--adaptive-main-width';
        break;
      case 'cross-refs':
        adaptiveVar = '--adaptive-cross-width';
        break;
      case 'alt-translation':
        adaptiveVar = '--adaptive-alt-width';
        break;
      case 'prophecy':
        adaptiveVar = '--adaptive-prophecy-width';
        break;
      case 'notes':
        adaptiveVar = '--adaptive-notes-width';
        break;
      case 'context':
        adaptiveVar = '--adaptive-context-width';
        break;
      case 'hybrid':
        return 'calc(var(--adaptive-main-width) * var(--column-width-mult, 1))'; // Use adaptive main width like other columns
      default:
        adaptiveVar = '--adaptive-alt-width'; // Fallback
    }
    
    // Return calc string for dynamic evaluation by the browser
    const calcExpression = `calc(var(${adaptiveVar}) * var(--column-width-mult, 1))`;
    
    logger.debug("COL", `🎛️ HEADERS: ${columnType} width calculation:`, {
      adaptiveVar,
      cssCalc: calcExpression,
      description: 'Using dynamic CSS calc() for responsive scaling'
    });
    
    return calcExpression;
  };

  // FIX: Create stable key for columns dependencies to prevent infinite loop
  // INSTANT HEADER UPDATE: Include display order array so headers update immediately on reorder
  const columnsKey = JSON.stringify({
    main: main ?? '',
    alternates: alternates ?? EMPTY_ARR,
    flags: { showNotes, showCrossRefs, showHybrid, showProphecy },
    widthsKeys: Object.keys(hookAdaptiveWidths ?? EMPTY_OBJ),
    transCount: Object.keys(translations ?? EMPTY_OBJ).length,
    cfCount: Object.keys(crossRefs ?? EMPTY_OBJ).length,
    prophCount: Object.keys(prophecyData ?? EMPTY_OBJ).length,
    columnOrder: columnState?.columns?.map(c => `${c.slot}:${c.displayOrder}`).join(',') ?? '',
  });

  // Build column configuration that matches VirtualRow exactly
  // Use the SAME logic as VirtualRow to prevent duplicate columns
  const columns: SimpleColumn[] = useMemo(() => {
    const cols: SimpleColumn[] = [];
    
    // Check if we're in mobile portrait mode to optimize column selection
    const isMobile = window.innerWidth <= 640;
    const isMobilePortrait = isPortrait && isMobile;

    // 🏗️ COLUMN CONFIG LOGGING - Initial State
    logger.debug("COL", '🏗️ COLUMN CONFIG - Building Headers:', {
      isPortrait,
      isMobile,
      isMobilePortrait,
      main: main || 'KJV',
      alternates: alternates.length,
      showCrossRefs,
      showNotes,
      showHybrid,
      showProphecy
    });

    // Use the same slotConfig system as VirtualRow to ensure consistency
    const slotConfig: Record<number, any> = {};

    // Always show reference column (slot 0)
    slotConfig[0] = { type: 'reference', header: '#', visible: true };

    // Notes column (slot 1) - aligned with columnLayout.ts
    slotConfig[1] = { type: 'notes', header: 'Notes', visible: showNotes };

    // Main translation (slot 2) - aligned with columnLayout.ts
    slotConfig[2] = { type: 'main-translation', header: main || 'KJV', translationCode: main || 'KJV', visible: true };

    // Map all column types based on store state - MUST check both columnState AND toggle state
    if (columnState?.columns) {
      columnState.columns.forEach(col => {
        switch (col.slot) {
          case 1:
            slotConfig[1] = { type: 'notes', header: 'Notes', visible: col.visible && showNotes };
            break;
          case 2:
            slotConfig[2] = { type: 'main-translation', header: main || 'KJV', translationCode: main || 'KJV', visible: col.visible };
            break;
          case 15:
            slotConfig[15] = { type: 'cross-refs', header: 'Cross Refs', visible: col.visible && showCrossRefs };
            break;
          case 16:
            slotConfig[16] = { type: 'prophecy', header: 'Prophecy', visible: col.visible && showProphecy };
            break;
          case 19:
            slotConfig[19] = { type: 'hybrid', header: 'Master', visible: col.visible && showHybrid };
            break;
        }
      });
    }

    // Alternate translation columns (slots 3-14) - appear before cross-refs
    alternates
      .filter(code => code !== (main || 'KJV'))
      .forEach((code, index) => {
        const slotNumber = 3 + index;
        if (slotNumber <= 14) {
          slotConfig[slotNumber] = {
            type: 'alt-translation',
            header: code,
            translationCode: code,
            visible: true
          };
        }
      });

    // Convert slotConfig to columns array (same as VirtualRow)
    Object.entries(slotConfig).forEach(([slotStr, config]) => {
      if (config?.visible === true) {
        const slot = parseInt(slotStr);
        
        // Map column types to header IDs
        let id: string;
        switch (config.type) {
          case 'reference':
            id = 'reference';
            break;
          case 'notes':
            id = 'notes';
            break;
          case 'main-translation':
            id = 'main-translation';
            break;
          case 'cross-refs':
            id = 'cross-refs';
            break;
          case 'prophecy':
            id = 'prophecy';
            break;
          case 'hybrid':
            id = 'hybrid';
            break;
          case 'alt-translation':
            id = `alt-translation-${config.translationCode}`;
            break;
          default:
            id = config.type;
        }

        cols.push({
          id,
          name: config.header,
          type: config.type,
          visible: true,
          width: getResponsiveWidth(config.type),
          slot: slot,
          isNavigable: config.type !== 'reference' && config.type !== 'hybrid' // Reference and hybrid columns are not navigable (sticky)
        });
      }
    });

    // 🔄 SORT BY DISPLAY ORDER - Same logic as VirtualBibleTable
    // This ensures headers match the body's column order after drag-and-drop
    if (columnState?.columns) {
      const slotToDisplayOrder = new Map();
      columnState.columns.forEach(col => {
        if (col.visible) {
          slotToDisplayOrder.set(col.slot, col.displayOrder);
        }
      });
      cols.forEach((col: any) => {
        col.displayOrder = slotToDisplayOrder.get(col.slot) ?? col.slot;
      });
      cols.sort((a: any, b: any) => (a.displayOrder ?? a.slot) - (b.displayOrder ?? b.slot));
    } else {
      cols.sort((a, b) => a.slot - b.slot);
    }

    // 🏗️ COLUMN CONFIG LOGGING - Final State
    const visibleCols = cols.filter(col => col.visible);
    const hiddenCols = cols.filter(col => !col.visible);
    
    logger.debug("COL", '🏗️ COLUMN CONFIG - Headers Built:', {
      totalColumns: cols.length,
      visibleColumns: visibleCols.length,
      hiddenColumns: hiddenCols.length,
      visibleIds: visibleCols.map(c => c.id).join(', '),
      hiddenIds: hiddenCols.map(c => c.id).join(', '),
      columnTrack: cols.map(c => `${c.id}(${c.visible ? '✓' : '✗'})`).join(' | ')
    });

    // 📊 DATA STATE LOGGING - Check what data is available for each column
    visibleCols.forEach(col => {
      let dataState = 'unknown';
      let dataDetails = {};
      
      switch (col.type) {
        case 'reference':
          dataState = 'always-ready';
          break;
        case 'main-translation':
          // Check if main translation data is available
          dataState = translations[main || 'KJV'] ? 'cached' : 'loading';
          dataDetails = { translation: main || 'KJV', hasData: !!translations[main || 'KJV'] };
          break;
        case 'cross-refs':
          const refCount = Object.keys(crossRefs).length;
          dataState = refCount > 0 ? 'loaded' : 'pending';
          dataDetails = { versesWithRefs: refCount };
          break;
        case 'alt-translation':
          const altCode = col.id.replace('alt-translation-', '');
          dataState = translations[altCode] ? 'cached' : 'loading';
          dataDetails = { translation: altCode, hasData: !!translations[altCode] };
          break;
        case 'prophecy':
          const prophecyCount = Object.keys(prophecyData || {}).length;
          dataState = prophecyCount > 0 ? 'loaded' : 'pending';
          dataDetails = { versesWithProphecies: prophecyCount };
          break;
        case 'notes':
          dataState = 'user-data';
          break;
        case 'hybrid':
          dataState = 'computed';
          break;
      }
      
      logger.debug("COL", `📊 DATA STATE - ${col.id}: ${dataState}`, dataDetails);
    });

    return cols;
  }, [columnsKey]); // FIX: Use stable key instead of raw arrays/objects

  // Sync columns with localColumns for drag and drop
  useEffect(() => {
    setLocalColumns(prev => (prev === columns ? prev : columns));
  }, [columns]);

  // Apply the same navigation filtering as VirtualRow to sync headers with columns
  const navigationOffset = useBibleStore(s => s.navigationOffset);
  const getVisibleSlice = useBibleStore(s => s.getVisibleSlice);
  
  // Derive the slice only when inputs change
  const visibleSlice = useMemo(() => getVisibleSlice(), [getVisibleSlice, navigationOffset, columns]);
  
  // Filter headers based on navigation slice - same logic as VirtualRow
  const visibleColumns = useMemo(() => {
    const referenceColumn = columns.find(col => col.slot === 0);
    const hybridColumn = columns.find(col => col.type === 'hybrid');
    const alwaysVisibleColumns: SimpleColumn[] = [];
    if (referenceColumn) alwaysVisibleColumns.push(referenceColumn);
    if (hybridColumn) alwaysVisibleColumns.push(hybridColumn);
    
    const navigableColumns = columns.filter(col => col.isNavigable && col.type !== 'hybrid');
    const slicedNavigableColumns = navigableColumns.slice(visibleSlice.start, visibleSlice.end);
    
    let filteredColumns = [...alwaysVisibleColumns, ...slicedNavigableColumns];
    
    // 🎯 CRITICAL FIX: Reindex visible columns to be contiguous (0, 1, 2, ...) 
    // This prevents CSS Grid from creating empty tracks for missing slot numbers
    filteredColumns = filteredColumns.map((col, index) => ({
      ...col,
      slot: index, // Reindex to contiguous slots: 0, 1, 2, 3...
      originalSlot: col.slot // Preserve original for debugging
    }));
    
    return filteredColumns;
  }, [columns, visibleSlice.start, visibleSlice.end, navigationOffset]);

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

        // Get slot numbers BEFORE reordering (not array indices)
        const fromSlot = items[oldIndex].slot;
        const toSlot = items[newIndex].slot;

        // Call the store's reorder method with actual slot numbers
        reorder(fromSlot, toSlot);

        const reorderedItems = arrayMove(items, oldIndex, newIndex);

        // Emit column order change signal to notify other components
        const emitOrderSignal = async () => {
          try {
            const { useColumnChangeEmitter } = await import('@/hooks/useColumnChangeSignal');
            const signal = useColumnChangeEmitter();
            signal('order', { 
              reorderedColumns: reorderedItems,
              oldIndex,
              newIndex,
              fromSlot,
              toSlot,
              timestamp: Date.now()
            });
          } catch (error) {
            logger.warn("COL", 'Could not emit column order change signal');
          }
        };
        
        emitOrderSignal();

        return reorderedItems;
      });
    }

    setActiveId(null);
  }

  // Column rendering logs removed for performance

  // Use the same centering logic as the table body to ensure headers stay aligned
  // Use state machine alignment directly - bypass all legacy centering logic
  const shouldCenter = alignmentState.alignment === 'center';
  const needsHorizontalScroll = actualTotalWidth > viewportWidth;
  const canSafelyCenterWithoutInterference = shouldCenter;

  // SUPER ADVANCED CENTERING LOGIC - matches table body exactly
  const advancedCenteringOffset = useMemo(() => {
    // Mobile/Portrait: Always left-aligned (0 offset)
    if (isMobile || isPortrait) {
      return 0;
    }
    
    // Desktop Landscape: Advanced centering detection
    // Same logic as CSS: .tableWrapper.twLandscape .bibleTable { margin: 0 auto }
    const contentFitsViewport = actualTotalWidth <= viewportWidth * 0.9; // 90% threshold for safety
    const shouldCenterContent = alignmentState.alignment === 'center';
    
    if (!shouldCenterContent || actualTotalWidth === 0 || viewportWidth === 0) {
      return 0; // Content too wide or needs scroll - stay at left edge
    }
    
    // EXACT centering calculation: (viewport - content) / 2
    // This matches how CSS margin: 0 auto centers the table body
    const centeringAmount = Math.max(0, (viewportWidth - actualTotalWidth) / 2);
    
    return centeringAmount;
  }, [isMobile, isPortrait, actualTotalWidth, viewportWidth, needsHorizontalScroll]);

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
      userSelect: 'none' as const,
      touchAction: 'none' as const,
    };

    // Reference column is never draggable (always fixed)
    const isDraggable = unlockMode && column.type !== 'reference';

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      if (isDraggable) {
        e.preventDefault();
      }
    }, [isDraggable]);

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
          ${column.type === 'reference' ? 'text-sm p-0' : 'text-xs px-2'}
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
        data-col-slot={column.slot}
        data-col-navigable={column.isNavigable ? 'true' : 'false'}
        onMouseDown={handleMouseDown}
        {...(isDraggable ? attributes : {})}
        {...(isDraggable ? listeners : {})}
      >
        <div className="flex items-center gap-1">
          {isDraggable && column.type !== 'reference' && (
            <GripVertical className="w-3 h-3" style={{color: 'var(--text-secondary)'}} />
          )}
          {column.name}
        </div>
      </div>
    );
  }

  // Master Column Header with Settings
  function MasterColumnHeaderCell({ column }: { column: SimpleColumn }) {
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
      userSelect: 'none' as const,
      touchAction: 'none' as const,
    };

    const isDraggable = unlockMode;
    
    // Live store (used by column system)
    const liveVisibility = useMasterColumnStore(s => s.sectionVisibility);
    const setSectionVisibility = useMasterColumnStore(s => s.setSectionVisibility);
    
    // UI/staging store (prevents column reconfiguration while menu is open)
    const open = useMasterMenuUI(s => s.open);
    const setOpen = useMasterMenuUI(s => s.setOpen);
    const staged = useMasterMenuUI(s => s.staged);
    const loadFrom = useMasterMenuUI(s => s.loadFrom);
    const setStaged = useMasterMenuUI(s => s.setStaged);
    const resetStage = useMasterMenuUI(s => s.resetStage);
    
    const onOpenChange = useCallback((next: boolean) => {
      if (next) {
        // Snapshot current live visibility so edits don't affect columns yet
        console.log('[MASTER-MENU] Opening menu, loading from live:', liveVisibility);
        loadFrom(liveVisibility);
        setOpen(true);
      } else {
        setOpen(false);
      }
    }, [liveVisibility, loadFrom, setOpen]);
    
    // Apply staged -> live once when closing with "Done"
    const commitAndClose = useCallback(() => {
      console.log('[MASTER-MENU] Committing staged changes:', staged);
      flushSync(() => {
        for (const [id, v] of Object.entries(staged)) {
          console.log('[MASTER-MENU] Setting', id, '=', v);
          setSectionVisibility(id as MasterColumnSectionId, v as boolean);
        }
      });
      console.log('[MASTER-MENU] Commit complete, closing menu');
      setOpen(false);
    }, [staged, setSectionVisibility, setOpen]);
    
    // Discard edits on outside/Esc
    const discardAndClose = useCallback(() => {
      setOpen(false); // Nothing applied; columns unchanged
    }, [setOpen]);
    
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      if (isDraggable && !open) {
        e.preventDefault();
      }
    }, [isDraggable, open]);
    
    // Disable drag listeners when menu is open to prevent event interference
    const dragProps = isDraggable && !open ? { ...attributes, ...listeners } : {};

    return (
      <div
        className={`
          column-header-cell 
          flex-shrink-0 
          flex
          items-center
          border-r 
          font-bold 
          text-xs 
          leading-none
          px-2
          ${isDragging ? 'opacity-50' : ''}
          ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
        style={{
          ...style,
          width: column.width,
          minWidth: column.width,
          maxWidth: column.width,
          boxSizing: 'border-box',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-color)'
        }}
        ref={setNodeRef}
        data-column={column.type}
        data-col-key={column.id}
        data-col-slot={column.slot}
        data-col-navigable={column.isNavigable ? 'true' : 'false'}
        onMouseDown={handleMouseDown}
        {...dragProps}
      >
        {isDraggable && (
          <GripVertical className="w-3 h-3 mr-1" style={{color: 'var(--text-secondary)'}} />
        )}
        <div className="flex-1 flex items-center justify-center">
          {column.name}
        </div>
        <Popover.Root open={open} onOpenChange={onOpenChange}>
          <Popover.Trigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 ml-1"
              data-testid="master-column-settings"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </Popover.Trigger>
          
          <Popover.Portal>
            <Popover.Content
              side="bottom"
              align="end"
              sideOffset={8}
              className={cn(
                "w-56 rounded-md border bg-popover p-2 shadow-md outline-none z-50",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
              )}
              onPointerDownOutside={(e) => { e.preventDefault(); discardAndClose(); }}
              onInteractOutside={(e) => { e.preventDefault(); discardAndClose(); }}
              onEscapeKeyDown={discardAndClose}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div className="px-2 pb-2 text-xs font-medium opacity-70">
                Master Column Sections
              </div>
              <div className="max-h-[50vh] overflow-auto pr-1">
                {MASTER_COLUMN_SECTIONS.map((section) => (
                  <label
                    key={section.id}
                    className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                    data-testid={`toggle-section-${section.id}`}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5"
                      checked={!!staged[section.id]}
                      onChange={(e) => setStaged(section.id, e.target.checked)}
                    />
                    <span className="text-sm">{section.label}</span>
                  </label>
                ))}
              </div>
              
              <div className="mt-2 border-t pt-2 flex gap-2">
                <button
                  className="flex-1 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => {
                    const defaults = MASTER_COLUMN_SECTIONS.reduce((acc, s) => {
                      acc[s.id] = true;
                      return acc;
                    }, {} as Record<string, boolean>);
                    resetStage(defaults);
                  }}
                  data-testid="reset-master-column-defaults"
                >
                  Reset
                </button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={commitAndClose}
                  data-testid="done-master-column-settings"
                >
                  Done
                </Button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
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
      {/* Invisible scroll blocker */}
      <div 
        style={{
          height: '1px',
          width: '100%',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          pointerEvents: 'none',
          opacity: 0
        }}
      />
      
      <div 
        ref={headerRef}
        className="column-headers-wrapper sticky top-0 bg-background border-b"
        style={{ 
          width: '100%',
          overflow: 'hidden',
          zIndex: shouldDisableDragAndDrop ? 50 : 20, // Higher z-index for mobile portrait to ensure stickiness
          position: 'sticky',
          touchAction: 'none', // Prevent touch scrolling from affecting underlying table
          overscrollBehavior: 'contain' // Contain scroll within element
        }}
      >

        {/* Column headers with drag and drop support */}
        <SortableContext 
          items={visibleColumns.map(col => col.id)} 
          strategy={horizontalListSortingStrategy}
        >
          {/* Headers container - MATCHES TABLE BODY ARCHITECTURE: All headers in centered container */}
          <div 
            className="column-headers-inner flex will-change-transform"
            style={{ 
              minWidth: 'fit-content',
              width: 'fit-content',
              margin: (isPortrait || !canSafelyCenterWithoutInterference) ? '0' : '0 auto', // SAME as table body
              transition: 'transform 0.3s ease',
              // In mobile portrait mode, use transform-based positioning instead of scrollLeft
              transform: (isMobile && isPortrait) ? undefined : `translateX(-${scrollLeft}px)`
            }}
          >
            {/* Reference header - INSIDE centered container like table body */}
            {visibleColumns.filter(col => col.id === 'reference').map((column) => (
              <div
                key={column.id}
                style={{
                  position: 'sticky',
                  left: '0px', // Always 0 - sticks to left of centered container like table body
                  zIndex: 30,
                  backgroundColor: 'var(--bg-primary)',
                  flexShrink: 0
                }}
              >
                <SortableHeaderCell column={column} />
              </div>
            ))}
            
            {/* Non-reference, non-hybrid headers - continue normally */}
            {visibleColumns.filter(col => col.id !== 'reference' && col.type !== 'hybrid').map((column) => (
              <SortableHeaderCell key={column.id} column={column} />
            ))}
            
            {/* Master Column header - STICKY RIGHT like reference is sticky left */}
            {visibleColumns.filter(col => col.type === 'hybrid').map((column) => (
              <div
                key={column.id}
                style={{
                  position: 'sticky',
                  right: '0px',
                  zIndex: 30,
                  backgroundColor: 'var(--bg-primary)',
                  flexShrink: 0,
                  width: column.width,
                  minWidth: column.width,
                  maxWidth: column.width
                }}
              >
                <MasterColumnHeaderCell column={column} />
              </div>
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