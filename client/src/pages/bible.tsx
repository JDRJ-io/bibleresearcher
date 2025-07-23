
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBibleStore } from '@/App';
import { TopHeader } from '@/components/bible/TopHeader';
import { VirtualBibleTable } from '@/components/bible/VirtualBibleTable';
import { StrongsOverlay } from '@/components/bible/StrongsOverlay';
import { ProphecyDetailDrawer } from '@/components/bible/ProphecyDetailDrawer';
import { SearchModal } from '@/components/bible/SearchModal';
import { LoadingWheel } from '@/components/LoadingWheel';
import { useBibleData } from '@/hooks/useBibleData';
import { useHashParams } from '@/hooks/useHashParams';
import { useBodyClass } from '@/hooks/useBodyClass';
import type { BibleVerse } from '@/types/bible';

export default function BiblePage() {
  const { store } = useBibleStore();
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [selectedProphecyId, setSelectedProphecyId] = useState<number | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Initialize body class
  useBodyClass('bible-page');

  // Handle URL parameters
  const { currentReference, setCurrentReference } = useHashParams();

  // Load Bible data with current reference
  const {
    verses,
    selectedTranslations,
    isLoading,
    loadingStage,
    loadingPercentage,
    scrollToVerse,
    handleNavigateToVerse,
    handleHighlight,
    getUserNoteForVerse,
    getHighlightsForVerse,
    allVerses,
    getGlobalVerseText
  } = useBibleData(currentReference);

  // Strong's overlay handler
  const handleExpandVerse = useCallback((verse: BibleVerse) => {
    console.log(`🔍 BiblePage handleExpandVerse called for ${verse.reference}`);
    setSelectedVerse(verse);
  }, []);

  const handleCloseStrongsOverlay = useCallback(() => {
    console.log('🔍 BiblePage closing Strong\'s overlay');
    setSelectedVerse(null);
  }, []);

  // Prophecy drawer handlers
  const handleOpenProphecyDetail = useCallback((prophecyId: number) => {
    console.log(`🔮 Opening prophecy detail for ID: ${prophecyId}`);
    setSelectedProphecyId(prophecyId);
  }, []);

  const handleCloseProphecyDetail = useCallback(() => {
    console.log('🔮 Closing prophecy detail');
    setSelectedProphecyId(null);
  }, []);

  // Add chronological order listener
  useEffect(() => {
    const handleChronologicalChange = (event: CustomEvent) => {
      console.log('📅 BiblePage received chronological order change:', event.detail);
      // The useBibleData hook will handle the actual reloading
    };

    window.addEventListener('chronologicalOrderChanged', handleChronologicalChange as EventListener);
    return () => {
      window.removeEventListener('chronologicalOrderChanged', handleChronologicalChange as EventListener);
    };
  }, []);

  // Determine if we should show loading
  const shouldShowLoading = isLoading && verses.length === 0;

  // Debug logging
  console.log('BiblePage render state:', {
    isLoading,
    versesLength: verses.length,
    loadingStage,
    loadingPercentage
  });

  // Force bypass loading for testing
  const forcedShouldShowLoading = false;
  console.log('🚫 LOADING BYPASSED FOR TESTING:', {
    originalIsLoading: isLoading,
    versesLength: verses.length,
    forcedShouldShowLoading
  });

  if (forcedShouldShowLoading) {
    console.log('BiblePage SHOWING LOADING:', {
      isLoading,
      versesLength: verses.length,
      shouldShowLoading: forcedShouldShowLoading
    });
    return (
      <div className="min-h-screen bg-background">
        <TopHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <LoadingWheel />
            <div className="text-muted-foreground">
              <div>{loadingStage}</div>
              <div className="text-xs mt-1">{loadingPercentage}%</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('BiblePage SHOWING INTERFACE:', {
    versesCount: verses.length,
    filteredCount: verses.length,
    firstVerse: verses[0],
    isLoading,
    shouldShowLoading: forcedShouldShowLoading
  });

  return (
    <div className="min-h-screen bg-background">
      <TopHeader />
      
      <main className="flex-1 overflow-hidden">
        <VirtualBibleTable
          ref={tableRef}
          verses={verses}
          selectedTranslations={selectedTranslations}
          onExpandVerse={handleExpandVerse}
          onHighlight={handleHighlight}
          onNavigateToVerse={handleNavigateToVerse}
          onOpenProphecyDetail={handleOpenProphecyDetail}
          getUserNoteForVerse={getUserNoteForVerse}
          getHighlightsForVerse={getHighlightsForVerse}
          allVerses={allVerses}
          getGlobalVerseText={getGlobalVerseText}
        />
      </main>

      {/* Strong's Overlay */}
      {selectedVerse && (
        <StrongsOverlay
          verse={selectedVerse}
          onClose={handleCloseStrongsOverlay}
        />
      )}

      {/* Prophecy Detail Drawer */}
      {selectedProphecyId && (
        <ProphecyDetailDrawer
          prophecyId={selectedProphecyId}
          onClose={handleCloseProphecyDetail}
        />
      )}

      {/* Search Modal */}
      <SearchModal />
    </div>
  );
}
