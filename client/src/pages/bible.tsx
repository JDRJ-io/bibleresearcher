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
import { useBibleData } from '@/hooks/useBibleData';
import { useHashParams } from '@/hooks/useHashParams';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useAdaptiveScaling } from '@/hooks/useAdaptiveScaling';
import { ThemeProvider } from '@/components/bible/ThemeProvider';
import { QuickLogger } from '@/components/debug/QuickLogger';
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
    mainTranslation,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    navigateToVerse
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

  // Navigation handler for cross-references and hyperlinks
  const handleNavigateToVerse = useCallback((reference: string) => {
    // Use the navigateToVerse function from useBibleData for proper navigation with history
    navigateToVerse(reference);
  }, [navigateToVerse]);

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

    // Handle cross-reference navigation to new Bible sections
    const handleNavigateToReference = (event: CustomEvent) => {
      const { reference, book, chapter, verse } = event.detail;
      
      // Use the handleNavigateToVerse function that's already set up
      if (handleNavigateToVerse) {
        handleNavigateToVerse(reference);
      }
    };

    window.addEventListener('chronologicalOrderChanged', handleChronologicalChange as EventListener);
    window.addEventListener('navigate-to-reference', handleNavigateToReference as EventListener);
    
    return () => {
      window.removeEventListener('chronologicalOrderChanged', handleChronologicalChange as EventListener);
      window.removeEventListener('navigate-to-reference', handleNavigateToReference as EventListener);
    };
  }, [handleNavigateToVerse]);

  // Determine if we should show loading
  const shouldShowLoading = isLoading && verses.length === 0;

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
              <LoadingWheel />
              <div className="text-muted-foreground">
                Loading Bible...
              </div>
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

        <main className="flex-1 overflow-hidden">
          <VirtualBibleTable
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
            onNavigateToVerse={navigateToVerse}
          />
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
        {import.meta.env.DEV && <QuickLogger position="bottom-right" minimized={true} />}
      </div>
    </ThemeProvider>
  );
}