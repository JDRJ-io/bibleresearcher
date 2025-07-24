import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBibleStore } from '@/App';
import { TopHeader } from '@/components/bible/TopHeader';
import VirtualBibleTable from '@/components/bible/VirtualBibleTable';
import StrongsOverlay from '@/components/bible/StrongsOverlay';
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
    versesLength: verses.length
  });

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopHeader
        searchQuery=""
        onSearchChange={() => {}}
        onBack={() => {}}
        onForward={() => {}}
        canGoBack={false}
        canGoForward={false}
        onMenuToggle={() => {}}
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
    <div className="min-h-screen bg-background">
      <TopHeader
        searchQuery=""
        onSearchChange={() => {}}
        onBack={() => {}}
        onForward={() => {}}
        canGoBack={false}
        canGoForward={false}
        onMenuToggle={() => {}}
      />

      <main className="flex-1 overflow-hidden">
        <VirtualBibleTable
          verses={verses}
          selectedTranslations={selectedTranslations}
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
        />
      </main>

      {/* Strong's Overlay */}
      {selectedVerse && (
        <StrongsOverlay
          verse={selectedVerse}
          isOpen={!!selectedVerse}
          onClose={handleCloseStrongsOverlay}
          onNavigateToVerse={(verseId: string) => console.log('Navigate to:', verseId)}
        />
      )}

      {/* Prophecy Detail Drawer */}
      {selectedProphecyId && (
        <ProphecyDetailDrawer
          prophecyIds={[selectedProphecyId]}
          onClose={handleCloseProphecyDetail}
        />
      )}

      {/* Search Modal */}
      <SearchModal 
        isOpen={false}
        onClose={() => {}}
        onNavigateToVerse={(verseId: string) => console.log('Navigate to:', verseId)}
      />
    </div>
  );
}