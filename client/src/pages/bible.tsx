import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { useBibleStore } from '@/App';
import Footer from "@/components/Footer";
import { TopHeader } from '@/components/bible/TopHeader';
import { ColumnPivotControls } from '@/components/bible/ColumnPivotControls';
import { PresetBar } from '@/components/bible/PresetBar';
import { NewColumnHeaders } from '@/components/bible/NewColumnHeaders';
import { useAuth } from '@/contexts/AuthContext';
import VirtualBibleTable from '@/components/bible/VirtualBibleTable';
import { SearchModal } from '@/components/bible/SearchModal';
import { HamburgerMenu } from '@/components/bible/HamburgerMenu';
import { LoadingWheel } from '@/components/LoadingWheel';
import { SEOHead } from '@/components/SEOHead';
import { Minimize2, Maximize2 } from 'lucide-react';

const StrongsOverlay = lazy(() => import('@/components/bible/StrongsOverlay').then(module => ({ default: module.StrongsOverlay })));
const ProphecyDetailDrawer = lazy(() => import('@/components/bible/ProphecyDetailDrawer').then(module => ({ default: module.ProphecyDetailDrawer })));
import { useBibleData } from '@/hooks/useBibleData';
import { useHashParams } from '@/hooks/useHashParams';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAdaptiveScaling } from '@/hooks/useAdaptiveScaling';
import { useLoadingDetection } from '@/hooks/useLoadingDetection';
import { ThemeProvider } from '@/components/bible/ThemeProvider';
import { useVerseNav } from '@/hooks/useVerseNav';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { useReadingState } from '@/hooks/useReadingState';
import { markDirty } from '@/hooks/useSessionState';
import type { VirtualBibleTableHandle } from '@/components/bible/VirtualBibleTable';
import { PatchNotesBanner } from '@/components/ui/PatchNotesBanner';
import { IntroOverlay } from '@/components/ui/IntroOverlay';
import { logger } from '@/lib/logger';
import { ViewportProvider } from '@/components/bible/ViewportProvider';
import { setupDynamicViewport } from '@/utils/viewportHeight';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useIsMobile } from '@/hooks/use-mobile';

import type { BibleVerse } from '@/types/bible';

// Responsive Header Positioning Hook
const useResponsiveHeaderPositioning = (isPatchNotesBannerVisible: boolean) => {
  const [positions, setPositions] = useState({
    banner: '50px',
    presetBar: '48px',
    columnHeaders: '88px',
    mainPadding: '0px'
  });

  useEffect(() => {
    const updatePositions = () => {
      const isMobile = window.innerWidth <= 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      
      if (!isPortrait) {
        // Landscape mode - uses mobile values but with 0 main padding
        setPositions({
          banner: '50px',
          presetBar: isPatchNotesBannerVisible ? '110px' : '48px',
          columnHeaders: isPatchNotesBannerVisible ? '150px' : '88px',
          mainPadding: '0px'
        });
      } else if (isMobile) {
        // Mobile portrait mode
        setPositions({
          banner: '50px',
          presetBar: isPatchNotesBannerVisible ? '110px' : '48px',
          columnHeaders: isPatchNotesBannerVisible ? '150px' : '88px',
          mainPadding: isPatchNotesBannerVisible ? '10px' : '8px'
        });
      } else {
        // Desktop portrait mode
        setPositions({
          banner: '60px',
          presetBar: isPatchNotesBannerVisible ? '130px' : '60px',
          columnHeaders: isPatchNotesBannerVisible ? '170px' : '98px',
          mainPadding: isPatchNotesBannerVisible ? '4px' : '0px'
        });
      }
    };
    
    updatePositions();
    window.addEventListener('resize', updatePositions);
    window.addEventListener('orientationchange', updatePositions);
    
    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('orientationchange', updatePositions);
    };
  }, [isPatchNotesBannerVisible]);
  
  return positions;
};

export default function BiblePage() {
  const { columnState, showCrossRefs, showNotes, showDates, showProphecies, showContext, setAlignmentLockMode } = useBibleStore();
  const authResult = useAuth();
  const user = authResult?.user || null;
  const profile = authResult?.profile || null;
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [initialStrongsKey, setInitialStrongsKey] = useState<string | undefined>(undefined);
  const [selectedProphecyId, setSelectedProphecyId] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isIntroOverlayOpen, setIsIntroOverlayOpen] = useState(false);
  const [isPatchNotesBannerVisible, setIsPatchNotesBannerVisible] = useState(true);
  const [currentVerse, setCurrentVerse] = useState<{ reference: string; index: number }>({ reference: 'Gen.1:1', index: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const tableRef = useRef<VirtualBibleTableHandle>(null);
  const stickyHeaderWrapperRef = useRef<HTMLDivElement>(null);
  
  // Mobile detection for alignment mode
  const isMobile = useIsMobile();

  // Measure sticky header height dynamically for Focus Mode
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(62);
  
  useLayoutEffect(() => {
    if (!isMinimized) {
      setStickyHeaderHeight(62);
      return;
    }
    
    const measureHeaders = () => {
      const presetBar = document.querySelector('.preset-bar');
      const columnHeaders = document.querySelector('.column-headers-section');
      
      const presetBarHeight = presetBar?.getBoundingClientRect().height || 0;
      const columnHeadersHeight = columnHeaders?.getBoundingClientRect().height || 0;
      const totalHeight = presetBarHeight + columnHeadersHeight;
      
      if (totalHeight > 0) {
        setStickyHeaderHeight(totalHeight);
      }
    };
    
    measureHeaders();
    const timeoutId = setTimeout(measureHeaders, 200);
    
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measureHeaders, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMinimized]);

  // Get responsive header positioning based on viewport and banner visibility
  const headerPositions = useResponsiveHeaderPositioning(isPatchNotesBannerVisible);

  // Set alignment lock mode based on device type
  // Mobile: Always left-aligned (leftLocked mode)
  // Desktop: Dynamic alignment (auto mode - center when fits, left when overflow)
  // Use layoutEffect to set before first paint, preventing flicker
  useLayoutEffect(() => {
    if (isMobile) {
      logger.debug('BIBLE', '📱 Mobile device detected - setting leftLocked alignment mode');
      setAlignmentLockMode('leftLocked');
    } else {
      logger.debug('BIBLE', '🖥️ Desktop device detected - setting auto alignment mode');
      setAlignmentLockMode('auto');
    }
    // No cleanup: alignment mode is always explicitly set based on current device type
  }, [isMobile, setAlignmentLockMode]);

  // Show intro overlay for first-time visitors (within 10 minutes)
  useEffect(() => {
    const lastVisit = localStorage.getItem('lastVisit');
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    
    if (!lastVisit || (now - parseInt(lastVisit)) > tenMinutes) {
      setIsIntroOverlayOpen(true);
      localStorage.setItem('lastVisit', now.toString());
    }
  }, []);

  // Mobile viewport meta tag: Disable zoom for this view only
  useEffect(() => {
    const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (viewportMeta) {
      const originalContent = viewportMeta.content;
      viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
      
      // Restore original viewport settings when leaving the Bible page
      return () => {
        viewportMeta.content = originalContent;
      };
    }
  }, []);

  // Auto-close patch notes banner on virtual table scroll
  useEffect(() => {
    const handleVirtualTableScroll = () => {
      setIsPatchNotesBannerVisible(false);
    };

    // Listen for virtual table scroll events
    window.addEventListener('virtualTableScroll', handleVirtualTableScroll);
    return () => window.removeEventListener('virtualTableScroll', handleVirtualTableScroll);
  }, []);

  const handleCloseIntroOverlay = () => {
    setIsIntroOverlayOpen(false);
    localStorage.setItem('hasSeenIntro', 'true');
  };

  // Initialize body class and adaptive scaling
  useBodyClass('bible-page');
  useAdaptiveScaling();
  
  // Setup dynamic viewport height for landscape mobile optimization
  useEffect(() => {
    const cleanup = setupDynamicViewport();
    return cleanup;
  }, []);
  
  // Listen for session restore event
  useEffect(() => {
    const handleRestoreVerse = (event: Event) => {
      const customEvent = event as CustomEvent<{ verseKey: string }>;
      const verseKey = customEvent.detail?.verseKey;
      
      if (verseKey && tableRef.current) {
        logger.info('BIBLE', 'restoring-verse-position', { verseKey });
        
        // Small delay to ensure table is fully mounted
        setTimeout(() => {
          tableRef.current?.scrollToVerse(verseKey);
          logger.info('BIBLE', 'verse-position-restored', { verseKey });
        }, 1000); // 1s delay for table initialization
      }
    };
    
    window.addEventListener('restore-verse-position', handleRestoreVerse);
    
    return () => {
      window.removeEventListener('restore-verse-position', handleRestoreVerse);
    };
  }, [tableRef]); // Depend on tableRef so it works after mount
  
  // Smart loading detection
  const { isLoading: isSmartLoading, connectionSpeed, startLoading, stopLoading } = useLoadingDetection();
  
  // Connect navigation events to loading detection
  useEffect(() => {
    const handleNavigationStarted = () => {
      if (connectionSpeed === 'slow' || connectionSpeed === 'medium') {
        startLoading('navigation');
      }
    };
    
    const handleNavigationCompleted = () => {
      stopLoading();
    };
    
    window.addEventListener('navigationStarted', handleNavigationStarted);
    window.addEventListener('navigationCompleted', handleNavigationCompleted);
    
    return () => {
      window.removeEventListener('navigationStarted', handleNavigationStarted);
      window.removeEventListener('navigationCompleted', handleNavigationCompleted);
    };
  }, [connectionSpeed, startLoading, stopLoading]);

  // Handle URL parameters
  const { hashParams, updateHashParams } = useHashParams();
  const currentReference = hashParams.reference || 'Gen.1:1';

  // Load Bible data with current reference (must be before callbacks that use mainTranslation)
  const {
    verses,
    selectedTranslations,
    isLoading,
    allVerses,
    getGlobalVerseText,
    mainTranslation
  } = useBibleData();

  // Navigation system - use the exposed scroll function from VirtualBibleTable
  const scrollToVerse = useCallback((ref: string) => {
    console.log('📜 BiblePage scrollToVerse called with:', ref, 'tableRef.current exists:', !!tableRef.current);
    tableRef.current?.scrollToVerse(ref);
  }, []);

  // Handle current verse changes from VirtualBibleTable
  const handleCurrentVerseChange = useCallback((verseInfo: { reference: string; index: number }) => {
    // console.log('📍 BiblePage: Current verse changed to:', verseInfo); // Disabled for performance
    setCurrentVerse(verseInfo);
    // Mark session as dirty to save current verse position
    markDirty();
    // NOTE: Don't call recordNav() here - it spams the database during scrolling
    // Navigation recording happens in goTo() for intentional navigation only
  }, []);

  // Get current verse helper for TopHeader
  const getCurrentVerseFromTable = useCallback(() => {
    if (tableRef.current?.getCurrentVerse) {
      return tableRef.current.getCurrentVerse();
    }
    return currentVerse;
  }, [currentVerse]);
  
  const { goTo, goBack, goForward, canGoBack, canGoForward } = useVerseNav(scrollToVerse);
  
  // Initialize reading state management
  useReadingState();

  // Translation management
  const { setMain: setMainTranslation } = useTranslationMaps();

  // Strong's overlay handler
  const handleExpandVerse = useCallback((verse: BibleVerse) => {
    console.log(`🔍 BiblePage handleExpandVerse called for ${verse.reference}`);
    setSelectedVerse(verse);
  }, []);

  const handleCloseStrongsOverlay = useCallback(() => {
    console.log('🔍 BiblePage closing Strong\'s overlay');
    setSelectedVerse(null);
    setInitialStrongsKey(undefined);
  }, []);

  // Handle Strong's word click from master column
  const handleStrongsClick = useCallback((verseRef: string, strongsKey: string) => {
    console.log(`🎯 BiblePage handling Strong's click: ${strongsKey} in ${verseRef}`);
    
    // Find the verse from allVerses
    const targetVerse = allVerses.find(v => v.reference === verseRef);
    
    if (targetVerse) {
      console.log(`✅ Found verse for Strong's overlay: ${verseRef}`);
      setSelectedVerse(targetVerse);
      setInitialStrongsKey(strongsKey);
    } else {
      console.warn(`❌ Could not find verse ${verseRef} for Strong's overlay`);
    }
  }, [allVerses]);

  // Navigation handler for Strong's overlay
  const handleNavigateToVerse = useCallback((reference: string) => {
    console.log(`🔍 BiblePage navigating to verse: ${reference}`);
    
    // Normalize reference for better matching
    const normalizeReference = (ref: string) => {
      return ref.replace(/\s+/g, '').toLowerCase();
    };
    
    const normalizedRef = normalizeReference(reference);
    
    // Find the target verse with more robust matching
    let targetVerse = allVerses.find(v => normalizeReference(v.reference) === normalizedRef);
    
    // If not found, try direct format match (assuming v.reference is in dot format)
    if (!targetVerse) {
      targetVerse = allVerses.find(v => 
        v.reference === reference ||
        v.reference === reference.replace(/\s+/g, '.')
      );
    }
    
    // If still not found, try book/chapter/verse parsing
    if (!targetVerse) {
      const match = reference.match(/^(\w+)\.?(\d+):(\d+)$/);
      if (match) {
        const [, book, chapter, verse] = match;
        targetVerse = allVerses.find(v => 
          v.book === book && 
          v.chapter === parseInt(chapter) && 
          v.verse === parseInt(verse)
        );
      }
    }
    
    if (targetVerse) {
      console.log(`✅ Found target verse: ${targetVerse.reference} (ID: ${targetVerse.id}) - navigating to position`);
      
      // Use proper navigation to center the verse instead of opening Strong's overlay
      goTo(targetVerse.reference);
    } else {
      console.warn(`❌ Could not find verse for reference: ${reference}`);
      console.log(`🔍 Normalized search: ${normalizedRef}`);
      console.log('Available verses sample:', allVerses.slice(0, 5).map(v => ({ 
        ref: v.reference, 
        normalized: normalizeReference(v.reference),
        id: v.id 
      })));
    }
  }, [allVerses, goTo]);

  // Prophecy drawer handlers
  const handleOpenProphecyDetail = useCallback(async (prophecyId: number) => {
    console.log(`🔮 Opening prophecy detail for ID: ${prophecyId}`);
    
    // Ensure prophecy data is loaded before opening the drawer
    try {
      const { ensureProphecyLoaded } = await import('@/lib/prophecyCache');
      await ensureProphecyLoaded();
      console.log('✅ Prophecy data loaded for overlay');
    } catch (error) {
      console.error('❌ Failed to load prophecy data for overlay:', error);
    }
    
    setSelectedProphecyId(prophecyId);
  }, []);

  const handleCloseProphecyDetail = useCallback(() => {
    console.log('🔮 Closing prophecy detail');
    setSelectedProphecyId(null);
  }, []);

  // Menu toggle handler
  const handleMenuToggle = useCallback(() => {
    console.log(`🍔 Toggling menu: ${isMenuOpen} -> ${!isMenuOpen}`);
    setIsMenuOpen(!isMenuOpen);
  }, [isMenuOpen]);

  const handleMenuClose = useCallback(() => {
    console.log('🍔 Closing menu');
    setIsMenuOpen(false);
  }, []);

  // Search modal handlers
  const handleSearchTrigger = useCallback(() => {
    console.log('🔍 Opening search modal from TopHeader');
    console.log('🔍 Verses data being passed to SearchModal:', {
      versesLength: verses.length,
      firstVerse: verses[0]?.reference,
      sampleVerses: verses.slice(0, 3).map(v => v.reference)
    });
    setIsSearchModalOpen(true);
  }, [verses]);

  // Memoized calculation for actualTotalWidth to prevent infinite re-render loop
  const actualTotalWidth = useMemo(() => {
    // Calculate the actual total width based on ALL visible columns and CSS variables
    if (typeof window === 'undefined') return 1024;
    
    const computedStyle = getComputedStyle(document.documentElement);
    
    // Get base widths from CSS variables
    const refWidth = parseInt(computedStyle.getPropertyValue('--adaptive-ref-width') || '72');
    const mainWidth = parseInt(computedStyle.getPropertyValue('--adaptive-main-width') || '320');
    const altWidth = parseInt(computedStyle.getPropertyValue('--adaptive-alt-width') || '320');
    const notesWidth = parseInt(computedStyle.getPropertyValue('--adaptive-notes-width') || '320');
    const crossWidth = parseInt(computedStyle.getPropertyValue('--adaptive-cross-width') || '320');
    const prophecyWidth = parseInt(computedStyle.getPropertyValue('--adaptive-prophecy-width') || '360');
    const contextWidth = parseInt(computedStyle.getPropertyValue('--adaptive-context-width') || '400');
    
    // Get the column width multiplier (1.0 for normal, 2.0 for presentation mode, etc.)
    const multiplier = parseFloat(computedStyle.getPropertyValue('--column-width-mult') || '1');
    
    // Calculate total width including all visible columns
    let totalWidth = refWidth; // Reference is always visible
    
    // Main translation (always visible)
    totalWidth += mainWidth * multiplier;
    
    // Alternate translations
    totalWidth += (selectedTranslations.length - 1) * altWidth * multiplier;
    
    // Notes column - Check actual column state
    const notesColumn = columnState.columns.find(col => col.slot === 1);
    if (notesColumn?.visible) {
      totalWidth += notesWidth * multiplier;
    }
    
    // Cross-references - Check actual column state
    const crossColumn = columnState.columns.find(col => col.slot === 15);
    if (crossColumn?.visible) {
      totalWidth += crossWidth * multiplier;
    }
    
    // Prophecy column (when visible) - Check actual column state
    const prophecyColumn = columnState.columns.find(col => col.slot === 16);
    if (prophecyColumn?.visible) {
      totalWidth += prophecyWidth * multiplier;
    }
    
    // Master Column / Context (when visible) - Check actual column state
    const contextColumn = columnState.columns.find(col => col.slot === 19);
    if (contextColumn?.visible) {
      totalWidth += contextWidth * multiplier;
    }
    
    // Debug logging (throttled by logger)
    logger.debug('HEADER', 'centering', { 
      refWidth, 
      main: mainWidth * multiplier, 
      altCount: selectedTranslations.length - 1,
      notes: notesColumn?.visible ? notesWidth * multiplier : 0,
      cross: crossColumn?.visible ? crossWidth * multiplier : 0, 
      prophecy: prophecyColumn?.visible ? prophecyWidth * multiplier : 0,
      context: contextColumn?.visible ? contextWidth * multiplier : 0,
      multiplier,
      TOTAL: totalWidth, 
      viewport: window.innerWidth,
      canCenter: totalWidth < window.innerWidth
    }, { throttleMs: 500 });
    
    return totalWidth;
  }, [
    selectedTranslations.length,
    columnState.columns
  ]);

  // Memoized viewport width to prevent unnecessary recalculations
  const viewportWidth = useMemo(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1024;
  }, []);

  const handleSearchClose = useCallback(() => {
    setIsSearchModalOpen(false);
  }, []);

  // Listen for translation slot visibility events
  useEffect(() => {
    const handleSlotVisibility = (event: CustomEvent) => {
      const { slot, visible } = event.detail;
      
      // Get fresh columnState each time the event fires to avoid stale state
      const { columnState } = useBibleStore.getState();
      columnState.setVisible(slot, visible);
    };

    window.addEventListener('translation-slot-visibility', handleSlotVisibility as EventListener);
    
    return () => {
      window.removeEventListener('translation-slot-visibility', handleSlotVisibility as EventListener);
    };
  }, []);

  // Smart loading system event listeners
  useEffect(() => {
    const handleNavigationStart = (event: CustomEvent) => {
      const { reference, isMobile } = event.detail;
      if (connectionSpeed === 'slow' || connectionSpeed === 'medium') {
        startLoading('navigation');
      }
    };

    const handleNavigationComplete = (event: CustomEvent) => {
      const { reference } = event.detail;
      stopLoading();
    };

    window.addEventListener('navigationStarted', handleNavigationStart as EventListener);
    window.addEventListener('navigationCompleted', handleNavigationComplete as EventListener);

    return () => {
      window.removeEventListener('navigationStarted', handleNavigationStart as EventListener);
      window.removeEventListener('navigationCompleted', handleNavigationComplete as EventListener);
    };
  }, [startLoading, stopLoading, connectionSpeed]);

  // Add chronological order listener - triggers verse reloading
  useEffect(() => {
    const handleChronologicalChange = (event: CustomEvent) => {
      const { isChronological } = event.detail;
      
      // Trigger verse reloading through custom event for useBibleData hook
      const reloadEvent = new CustomEvent('reloadBibleData', { 
        detail: { isChronological } 
      });
      window.dispatchEvent(reloadEvent);
    };

    window.addEventListener('chronologicalOrderChanged', handleChronologicalChange as EventListener);
    return () => {
      window.removeEventListener('chronologicalOrderChanged', handleChronologicalChange as EventListener);
    };
  }, []);

  // Determine if we should show loading
  const shouldShowLoading = isLoading && verses.length === 0;
  const showSmartLoader = isSmartLoading && (connectionSpeed === 'slow' || connectionSpeed === 'medium');

  // Debug logging
  // console.log('BiblePage render state:', { // Disabled for performance
  //   isLoading,
  //   versesLength: verses.length
  // });

  if (shouldShowLoading) {
    return (
      <ThemeProvider>
        <div className="bible-content-area min-h-screen bg-background">
          <TopHeader
          searchQuery=""
          onSearchChange={handleSearchTrigger}
          onBack={goBack}
          onForward={goForward}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onMenuToggle={handleMenuToggle}
          getCurrentVerse={getCurrentVerseFromTable}
          goTo={goTo}
          selectedTranslations={[]}
          preferences={{}}
          scrollLeft={0}
          isGuest={!user}
          isCentered={false}
          actualTotalWidth={800}
          viewportWidth={800}
        />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <LoadingWheel size="large" message="Loading Scripture..." />
              {connectionSpeed !== 'unknown' && (
                <div className="text-xs text-muted-foreground/60">
                  Connection: {connectionSpeed}
                </div>
              )}
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // console.log('BiblePage SHOWING INTERFACE:', { // Disabled for performance
  //   versesCount: verses.length,
  //   filteredCount: verses.length,
  //   firstVerse: verses[0],
  //   isLoading,
  //   shouldShowLoading
  // });

  return (
    <ThemeProvider>
      <SEOHead
        title="Bible Study Platform"
        description="Read and study the Bible with multiple translations, cross-references, Strong's concordance, and advanced research tools."
        canonical="https://anointed.io/bible"
      />
      <ViewportProvider />
      <div className="bible-content-area min-h-screen bg-background">
        {/* Properly Stacked Sticky Header Sections */}
        
        {/* 1. Top Navigation Header - Always at top */}
        {!isMinimized && (
          <div className="sticky top-0 z-[60] bg-background">
            <TopHeader
              searchQuery=""
              onSearchChange={handleSearchTrigger}
              onBack={goBack}
              onForward={goForward}
              canGoBack={canGoBack}
              canGoForward={canGoForward}
              onMenuToggle={handleMenuToggle}
              getCurrentVerse={getCurrentVerseFromTable}
              goTo={goTo}
              selectedTranslations={[]}
              preferences={{}}
              scrollLeft={0}
              isGuest={!user}
              isCentered={false}
              actualTotalWidth={800}
              viewportWidth={800}
            />
          </div>
        )}

        {/* 2. Patch Notes Banner - Below header (responsive) */}
        {!isMinimized && isPatchNotesBannerVisible && (
          <div className="patch-notes-banner sticky z-[50] bg-background" style={{ top: headerPositions.banner }}>
            <PatchNotesBanner 
              isVisible={isPatchNotesBannerVisible}
              onDismiss={() => setIsPatchNotesBannerVisible(false)}
            />
          </div>
        )}

        {/* 3. Preset Bar - Below banner if visible, else below header (responsive) */}
        <div 
          className="sticky z-[50] bg-background" 
          style={{ 
            top: isMinimized ? '0px' : headerPositions.presetBar,
            touchAction: 'none',
            overscrollBehavior: 'contain'
          }}
        >
            <div className="preset-bar glass-morphism w-screen max-w-none -mx-[calc((100vw-100%)/2)] bg-background/95 border-b border-border/20 px-3 py-1">
              <div className="flex w-full items-center justify-between">
                {/* Left: Left Arrow */}
                <div className="flex items-center">
                  <ColumnPivotControls 
                    className="flex items-center gap-1"
                    isPresentationMode={false}
                    onTogglePresentation={() => {
                      console.log("🎯 Presentation mode toggle clicked");
                    }}
                    showLeftArrow={true}
                    showRightArrow={false}
                    showPresentButton={false}
                  />
                </div>
                
                {/* Center: Preset Buttons */}
                <div className="flex items-center">
                  <PresetBar />
                </div>
                
                {/* Right: Right Arrow */}
                <div className="flex items-center">
                  <ColumnPivotControls 
                    className="flex items-center gap-1"
                    isPresentationMode={false}
                    onTogglePresentation={() => {
                      console.log("🎯 Presentation mode toggle clicked");
                    }}
                    showLeftArrow={false}
                    showRightArrow={true}
                    showPresentButton={false}
                  />
                </div>
              </div>
            </div>
        </div>

        {/* 4. Column Headers - Below preset bar (responsive) */}
        <div 
          ref={stickyHeaderWrapperRef}
          className="sticky z-[45] bg-background" 
          style={{ top: isMinimized ? '40px' : headerPositions.columnHeaders }}
        >
            <div className="column-headers-section glass-morphism bg-background border-b border-border/20">
              <NewColumnHeaders 
                selectedTranslations={selectedTranslations.map(t => ({ id: t, name: t, abbreviation: t, selected: true }))}
                showNotes={showNotes}
                showCrossRefs={showCrossRefs}
                showDates={showDates}
                scrollLeft={0}
                preferences={{ 
                  showNotes: showNotes, 
                  selectedTranslations: selectedTranslations,
                  fontSize: 'medium',
                  theme: 'light',
                  showProphecy: showProphecies,
                  showContext: showContext,
                  layoutLocked: false
                }}
                isGuest={!user}
                isCentered={false}
                actualTotalWidth={actualTotalWidth}
                viewportWidth={viewportWidth}
              />
            </div>
        </div>

        <main 
          className="flex-1 overflow-hidden relative"
          style={{ 
            paddingTop: isMinimized ? '0px' : headerPositions.mainPadding,
            paddingBottom: '0px',
            marginTop: isMinimized ? `-${stickyHeaderHeight}px` : '0px'
          }}
        >
          <ErrorBoundary componentName="VirtualBibleTable">
            <VirtualBibleTable
              ref={tableRef}
              verses={verses}
              selectedTranslations={selectedTranslations.map(t => ({ id: t, name: t, abbreviation: t, selected: true }))}
              preferences={{ 
                showNotes: showNotes, 
                selectedTranslations: selectedTranslations,
                fontSize: 'medium',
                theme: 'light',
                showProphecy: showProphecies,
                showContext: showContext,
                layoutLocked: false
              }}
              mainTranslation={mainTranslation}
              onExpandVerse={handleExpandVerse}
              getGlobalVerseText={getGlobalVerseText}
              onVerseClick={goTo}
              onCurrentVerseChange={handleCurrentVerseChange}
              currentVerse={currentVerse}
              onOpenProphecy={handleOpenProphecyDetail}
              onStrongsClick={handleStrongsClick}
              isPatchNotesBannerVisible={isPatchNotesBannerVisible}
              isMenuOpen={isMenuOpen}
              isSearchModalOpen={isSearchModalOpen}
              isProphecyDrawerOpen={!!selectedProphecyId}
              isStrongsOverlayOpen={!!selectedVerse}
              isIntroOverlayOpen={isIntroOverlayOpen}
              isMinimized={isMinimized}
              headerBoundaryRef={stickyHeaderWrapperRef}
            />
          </ErrorBoundary>
          
          {/* Smart Loading Overlay - DISABLED: Was causing black overlay bug */}
          {false && showSmartLoader && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-40">
              <div className="text-center space-y-3">
                <LoadingWheel size="large" message="" />
                <div className="text-sm text-muted-foreground animate-pulse">
                  Navigating...
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Strong's Overlay - Lazy Loaded */}
        {selectedVerse && (
          <ErrorBoundary componentName="StrongsOverlay">
            <Suspense fallback={
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
                <LoadingWheel size="large" message="Loading Strong's Analysis..." />
              </div>
            }>
              <StrongsOverlay
                verse={selectedVerse}
                onClose={handleCloseStrongsOverlay}
                onNavigateToVerse={handleNavigateToVerse}
                allVerses={allVerses}
                initialStrongsKey={initialStrongsKey}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Prophecy Detail Drawer - Lazy Loaded */}
        {selectedProphecyId && (
          <ErrorBoundary componentName="ProphecyDetailDrawer">
            <Suspense fallback={
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
                <LoadingWheel size="large" message="Loading Prophecy Details..." />
              </div>
            }>
              <ProphecyDetailDrawer
                isOpen={!!selectedProphecyId}
                prophecyIds={[selectedProphecyId]}
                onClose={handleCloseProphecyDetail}
                onNavigateToVerse={handleNavigateToVerse}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Search Modal */}
        <SearchModal 
          isOpen={isSearchModalOpen}
          onClose={handleSearchClose}
          onNavigateToVerse={handleNavigateToVerse}
          onSwitchTranslation={setMainTranslation}
          verses={verses}
        />

        {/* Hamburger Menu */}
        <HamburgerMenu 
          isOpen={isMenuOpen}
          onClose={handleMenuClose}
          onNavigateToVerse={scrollToVerse}
        />

        {/* Mystical Intro Overlay for First-Time Visitors */}
        <IntroOverlay 
          isVisible={isIntroOverlayOpen} 
          onClose={handleCloseIntroOverlay} 
        />

        {/* Enhanced Footer */}
        {!isMinimized && <Footer />}
        
        {/* Development logging widget */}

      </div>

      {/* Minimize/Maximize Toggle Button - Fixed over footer */}
      <div
        className="
          fixed bottom-2 left-2 md:bottom-2 md:left-2
          z-50 pad-safe-left select-none
          pointer-events-none
        "
      >
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          aria-pressed={isMinimized}
          aria-label={isMinimized ? 'Restore header and footer' : 'Hide header and footer'}
          data-testid="button-toggle-minimize"
          className="
            pointer-events-auto
            rounded-full p-2.5
            bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md
            border border-gray-300/70 dark:border-neutral-700/60
            shadow-lg text-gray-900 dark:text-gray-100
            hover:bg-white/90 dark:hover:bg-neutral-800/90 transition
          "
        >
          {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </button>
      </div>
    </ThemeProvider>
  );
}