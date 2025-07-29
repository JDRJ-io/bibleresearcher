import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBibleStore } from '@/App';
import Footer from "@/components/Footer";
import { TopHeader } from '@/components/bible/TopHeader';
import VirtualBibleTable from '@/components/bible/VirtualBibleTable';
import { StrongsOverlay } from '@/components/bible/StrongsOverlay';
import { ProphecyDetailDrawer } from '@/components/bible/ProphecyDetailDrawer';
import { SearchModal } from '@/components/bible/SearchModal';
import { HamburgerMenu } from '@/components/bible/HamburgerMenu';
import { LoadingWheel } from '@/components/LoadingWheel';
import BibleHairFan from '@/components/ui/BibleHairFan';
import { useBibleData } from '@/hooks/useBibleData';
import { useHashParams } from '@/hooks/useHashParams';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAdaptiveScaling } from '@/hooks/useAdaptiveScaling';
import { useLoadingDetection } from '@/hooks/useLoadingDetection';
import { ThemeProvider } from '@/components/bible/ThemeProvider';
import { useVerseNav } from '@/hooks/useVerseNav';
import { makeScrollToVerse } from '@/utils/scrollToVerse';

import type { BibleVerse } from '@/types/bible';

export default function BiblePage() {
  const { store } = useBibleStore();
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [selectedProphecyId, setSelectedProphecyId] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Initialize body class and adaptive scaling
  useBodyClass('bible-page');
  useAdaptiveScaling();
  
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

  // Navigation system
  const scrollToVerse = makeScrollToVerse(tableRef);
  const { goTo, goBack, goForward, canGoBack, canGoForward } = useVerseNav(scrollToVerse);

  // Handle URL parameters
  const { hashParams, updateHashParams } = useHashParams();
  const currentReference = hashParams.reference || 'Gen.1:1';

  // Load Bible data with current reference
  const {
    verses,
    selectedTranslations,
    isLoading,
    allVerses,
    getGlobalVerseText,
    mainTranslation
  } = useBibleData();

  // Strong's overlay handler
  const handleExpandVerse = useCallback((verse: BibleVerse) => {
    console.log(`🔍 BiblePage handleExpandVerse called for ${verse.reference}`);
    setSelectedVerse(verse);
  }, []);

  const handleCloseStrongsOverlay = useCallback(() => {
    console.log('🔍 BiblePage closing Strong\'s overlay');
    setSelectedVerse(null);
  }, []);

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
      console.log(`✅ Found target verse: ${targetVerse.reference} (ID: ${targetVerse.id})`);
      setSelectedVerse(targetVerse);
      
      // Optional: Also scroll to the verse in the main table
      setTimeout(() => {
        const verseElement = document.getElementById(`verse-${targetVerse.id}`);
        if (verseElement) {
          verseElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 100);
    } else {
      console.warn(`❌ Could not find verse for reference: ${reference}`);
      console.log(`🔍 Normalized search: ${normalizedRef}`);
      console.log('Available verses sample:', allVerses.slice(0, 5).map(v => ({ 
        ref: v.reference, 
        normalized: normalizeReference(v.reference),
        id: v.id 
      })));
    }
  }, [allVerses]);

  // Prophecy drawer handlers
  const handleOpenProphecyDetail = useCallback((prophecyId: number) => {
    console.log(`🔮 Opening prophecy detail for ID: ${prophecyId}`);
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
    setIsSearchModalOpen(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    console.log('🔍 Closing search modal');
    setIsSearchModalOpen(false);
  }, []);

  // Listen for translation slot visibility events
  useEffect(() => {
    const { columnState } = useBibleStore.getState();
    
    const handleSlotVisibility = (event: CustomEvent) => {
      const { slot, visible } = event.detail;
      console.log(`📡 Received slot visibility event: slot ${slot} → ${visible}`);
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
      console.log('📖 Navigation started:', reference, 'mobile:', isMobile);
      if (connectionSpeed === 'slow' || connectionSpeed === 'medium') {
        startLoading('navigation');
      }
    };

    const handleNavigationComplete = (event: CustomEvent) => {
      const { reference } = event.detail;
      console.log('📖 Navigation completed:', reference);
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
      console.log('📅 STEP 2: BiblePage received chronological order change:', event.detail);
      const { isChronological } = event.detail;
      
      // Trigger verse reloading through custom event for useBibleData hook
      const reloadEvent = new CustomEvent('reloadBibleData', { 
        detail: { isChronological } 
      });
      window.dispatchEvent(reloadEvent);
      console.log('📅 STEP 3: BiblePage dispatched reloadBibleData event with isChronological:', isChronological);
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
  console.log('BiblePage render state:', {
    isLoading,
    versesLength: verses.length
  });

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
        />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <BibleHairFan 
                size={140} 
                color="#2fc2ff" 
                duration={1800} 
                spread={60} 
                strands={30} 
              />
              <div className="text-muted-foreground animate-pulse">
                Loading Scripture...
              </div>
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

  console.log('BiblePage SHOWING INTERFACE:', {
    versesCount: verses.length,
    filteredCount: verses.length,
    firstVerse: verses[0],
    isLoading,
    shouldShowLoading
  });

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
        />

        <main className="flex-1 overflow-hidden relative">
          <VirtualBibleTable
            ref={tableRef}
            verses={verses}
            selectedTranslations={selectedTranslations.map(t => ({ id: t, name: t, abbreviation: t, selected: true }))}
            preferences={{ 
              showNotes: true, 
              selectedTranslations: selectedTranslations,
              fontSize: 'medium',
              theme: 'light',
              showProphecy: store.showProphecy,
              showContext: store.showContext,
              layoutLocked: false
            }}
            mainTranslation={mainTranslation}
            onExpandVerse={handleExpandVerse}
            getGlobalVerseText={getGlobalVerseText}
            onVerseClick={goTo}
          />
          
          {/* Smart Loading Overlay */}
          {showSmartLoader && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-40">
              <div className="text-center space-y-3">
                <HolyBookLoader size="md" />
                <div className="text-sm text-muted-foreground animate-pulse">
                  Navigating...
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Strong's Overlay */}
        {selectedVerse && (
          <StrongsOverlay
            verse={selectedVerse}
            isOpen={!!selectedVerse}
            onClose={handleCloseStrongsOverlay}
            onNavigateToVerse={handleNavigateToVerse}
          />
        )}

        {/* Prophecy Detail Drawer */}
        {selectedProphecyId && (
          <ProphecyDetailDrawer
            isOpen={!!selectedProphecyId}
            prophecyIds={[selectedProphecyId]}
            onClose={handleCloseProphecyDetail}
            onNavigateToVerse={handleNavigateToVerse}
          />
        )}

        {/* Search Modal */}
        <SearchModal 
          isOpen={isSearchModalOpen}
          onClose={handleSearchClose}
          onNavigateToVerse={handleNavigateToVerse}
        />

        {/* Hamburger Menu */}
        <HamburgerMenu 
          isOpen={isMenuOpen}
          onClose={handleMenuClose}
        />

        {/* Subtle Footer */}
        <Footer />
        
        {/* Development logging widget */}

      </div>
    </ThemeProvider>
  );
}