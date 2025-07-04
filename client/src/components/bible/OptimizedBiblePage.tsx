import { useState, useEffect, useRef } from 'react';
import { useDataWorker } from '@/hooks/useDataWorker';
import { useBibleData } from '@/hooks/useBibleData';
import { useAuth } from '@/hooks/useAuth';
import { TopHeader } from './TopHeader';
import { HamburgerMenu } from './HamburgerMenu';
import { AuthModal } from './AuthModal';
import { VerseSelector } from './VerseSelector';
import { TranslationSelector } from './TranslationSelector';
import { LoadingWheel } from '../LoadingWheel';
import { Button } from '@/components/ui/button';
import type { AppPreferences, Translation } from '@/types/bible';

// Memory-efficient virtual scrolling with worker-based data
export function OptimizedBiblePage() {
  const { user } = useAuth();
  const { verses, isLoading: bibleLoading, navigateToVerse } = useBibleData();
  const { 
    isReady: workerReady, 
    isLoading: workerLoading, 
    loadingStage, 
    progress, 
    stats,
    loadData: loadWorkerData 
  } = useDataWorker();

  // UI State
  const [showMenu, setShowMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [expandedVerse, setExpandedVerse] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTranslations, setSelectedTranslations] = useState<Translation[]>([]);
  const [mainTranslation, setMainTranslation] = useState('KJV');
  const [showVerseSelector, setShowVerseSelector] = useState(false);
  const [showTranslationSelector, setShowTranslationSelector] = useState(false);
  
  // Virtual scrolling state
  const [scrollPosition, setScrollPosition] = useState(0);
  const [visibleVerses, setVisibleVerses] = useState<any[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // App preferences
  const [preferences, setPreferences] = useState<AppPreferences>({
    showNotes: true,
    showProphecy: true,
    showContext: true,
    showStrongs: false,
    showCrossRefs: true,
    theme: 'light',
    fontSize: 16,
    columnOrder: ['reference', 'text', 'crossrefs'],
    multiTranslationMode: false
  });

  // Initialize worker data loading
  useEffect(() => {
    if (!workerReady && !workerLoading) {
      loadWorkerData();
    }
  }, [workerReady, workerLoading, loadWorkerData]);

  // Virtual scrolling logic
  useEffect(() => {
    if (!verses.length || !scrollContainerRef.current) return;

    const ROW_HEIGHT = 120;
    const BUFFER_SIZE = 60; // ±60 verses visible
    const container = scrollContainerRef.current;
    
    const updateVisibleVerses = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      
      const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
      const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / ROW_HEIGHT) + BUFFER_SIZE,
        verses.length
      );
      
      const visibleStartIndex = Math.max(0, startIndex - BUFFER_SIZE);
      const visibleEndIndex = Math.min(verses.length, endIndex + BUFFER_SIZE);
      
      const newVisibleVerses = verses.slice(visibleStartIndex, visibleEndIndex).map((verse, index) => ({
        ...verse,
        virtualIndex: visibleStartIndex + index,
        top: (visibleStartIndex + index) * ROW_HEIGHT
      }));
      
      setVisibleVerses(newVisibleVerses);
      setScrollPosition(scrollTop);
    };

    updateVisibleVerses();
    
    const handleScroll = () => {
      requestAnimationFrame(updateVisibleVerses);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [verses]);

  // Jump to verse handler
  useEffect(() => {
    const handleJumpToVerse = (event: CustomEvent) => {
      const { reference } = event.detail;
      navigateToVerse(reference);
    };

    window.addEventListener('jumpToVerse', handleJumpToVerse as EventListener);
    return () => window.removeEventListener('jumpToVerse', handleJumpToVerse as EventListener);
  }, [navigateToVerse]);

  const renderVirtualRow = (verse: any) => {
    const { reference, text, crossReferences = [], virtualIndex, top } = verse;
    
    // Get normalized data from worker
    const translationData = (window as any).translationData || {};
    const crossRefSets = (window as any).crossRefSets || {};
    const prophecyByVerse = (window as any).prophecyByVerse || {};
    
    // Cross-reference column
    const crossRefLines = crossRefSets.default?.[reference] || [];
    const crossRefHTML = crossRefLines
      .flatMap((line: string) => line.split(/[~#]/))
      .filter(Boolean)
      .slice(0, 6) // Limit to 6 references
      .map((ref: string) => {
        const refText = translationData[mainTranslation]?.[ref] || '';
        const preview = refText ? `: ${refText.substring(0, 50)}...` : '';
        const id = ref.replace(/[.:]/g, '_');
        return `<a href="#" onclick="window.jumpToVerse('${id}')">${ref}</a>${preview}`;
      })
      .join('<br>');

    // Prophecy data
    const prophecyInfo = prophecyByVerse[reference] || {};
    const predHTML = buildProphecyHTML(prophecyInfo.pred || [], prophecyInfo.titles || []);
    const fulHTML = buildProphecyHTML(prophecyInfo.ful || [], prophecyInfo.titles || []);
    const verHTML = buildProphecyHTML(prophecyInfo.ver || [], prophecyInfo.titles || []);

    return (
      <div
        key={`${reference}-${virtualIndex}`}
        className="verse-row border-b border-gray-200 dark:border-gray-700 flex"
        style={{
          position: 'absolute',
          top: `${top}px`,
          left: 0,
          right: 0,
          height: '120px',
          padding: '8px',
          boxSizing: 'border-box'
        }}
      >
        {/* Reference column */}
        <div className="w-24 flex-shrink-0 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          {reference}
        </div>
        
        {/* Text column */}
        <div className="flex-1 px-2 overflow-y-auto">
          <div className="text-sm leading-relaxed">
            {text[mainTranslation] || `[${reference} - ${mainTranslation} loading...]`}
          </div>
        </div>
        
        {/* Cross-references column */}
        {preferences.showCrossRefs && (
          <div 
            className="w-48 px-2 text-xs overflow-y-auto text-blue-600 dark:text-blue-400"
            dangerouslySetInnerHTML={{ __html: crossRefHTML }}
          />
        )}
        
        {/* Prophecy columns */}
        {preferences.showProphecy && (
          <>
            <div 
              className="w-32 px-2 text-xs overflow-y-auto text-green-600 dark:text-green-400"
              dangerouslySetInnerHTML={{ __html: predHTML }}
            />
            <div 
              className="w-32 px-2 text-xs overflow-y-auto text-orange-600 dark:text-orange-400"
              dangerouslySetInnerHTML={{ __html: fulHTML }}
            />
            <div 
              className="w-32 px-2 text-xs overflow-y-auto text-purple-600 dark:text-purple-400"
              dangerouslySetInnerHTML={{ __html: verHTML }}
            />
          </>
        )}
      </div>
    );
  };

  const buildProphecyHTML = (verses: string[], titles: string[]): string => {
    if (!verses.length) return '';
    
    const uniqueTitles = Array.from(new Set(titles));
    const titleHTML = uniqueTitles.map(title => `<strong>${title}</strong>`).join('<br>');
    const versesHTML = verses.map(v => `<div>${v}</div>`).join('');
    
    return `${titleHTML}<br>${versesHTML}`;
  };

  // Show loading screen
  if (bibleLoading || workerLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingWheel 
          message={workerLoading ? `${loadingStage} (${progress}%)` : 'Loading Bible...'}
          size="large"
        />
      </div>
    );
  }

  const totalHeight = verses.length * 120; // 120px per verse

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <TopHeader
        onMenuToggle={() => setShowMenu(!showMenu)}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        onShowVerseSelector={() => setShowVerseSelector(true)}
        onShowTranslationSelector={() => setShowTranslationSelector(true)}
        mainTranslation={mainTranslation}
        multiTranslationMode={preferences.multiTranslationMode}
        selectedTranslations={selectedTranslations}
      />

      <div className="flex-1 relative overflow-hidden">
        {/* Fixed column headers */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex">
          <div className="w-24 flex-shrink-0 px-2 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Reference
          </div>
          <div className="flex-1 px-2 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            {mainTranslation} Text
          </div>
          {preferences.showCrossRefs && (
            <div className="w-48 px-2 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Cross-References
            </div>
          )}
          {preferences.showProphecy && (
            <>
              <div className="w-32 px-2 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Predictions
              </div>
              <div className="w-32 px-2 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Fulfillments
              </div>
              <div className="w-32 px-2 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Verification
              </div>
            </>
          )}
        </div>

        {/* Virtual scrolling container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto relative"
          style={{ height: 'calc(100vh - 120px)' }}
        >
          {/* Placeholder for total height */}
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            {visibleVerses.map(renderVirtualRow)}
          </div>
        </div>
      </div>

      {/* Worker stats display */}
      {workerReady && stats && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900 text-xs text-blue-700 dark:text-blue-300">
          Worker ready: {stats.translationsCount} translations, {stats.crossRefsCount} cross-ref sets, {stats.prophecyCount} prophecy verses
        </div>
      )}

      {/* Modals */}
      {showMenu && (
        <HamburgerMenu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          preferences={preferences}
          onPreferencesChange={setPreferences}
          onShowAuth={() => setShowAuthModal(true)}
        />
      )}

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {showVerseSelector && (
        <VerseSelector
          isOpen={showVerseSelector}
          onClose={() => setShowVerseSelector(false)}
          onSelectVerse={(reference) => {
            navigateToVerse(reference);
            setShowVerseSelector(false);
          }}
        />
      )}

      {showTranslationSelector && (
        <TranslationSelector
          isOpen={showTranslationSelector}
          onClose={() => setShowTranslationSelector(false)}
          selectedTranslations={selectedTranslations}
          onTranslationsChange={setSelectedTranslations}
          mainTranslation={mainTranslation}
          onMainTranslationChange={setMainTranslation}
          multiTranslationMode={preferences.multiTranslationMode}
          onMultiTranslationModeChange={(mode) => 
            setPreferences({ ...preferences, multiTranslationMode: mode })
          }
        />
      )}
    </div>
  );
}