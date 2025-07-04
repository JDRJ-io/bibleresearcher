import { useState, useEffect, useRef } from 'react';
import { useDataWorker } from '@/hooks/useDataWorker';
import { LoadingWheel } from '@/components/LoadingWheel';

// Memory-efficient Bible page with virtual scrolling
export default function BibleLitePage() {
  const { 
    isReady: workerReady, 
    isLoading: workerLoading, 
    loadingStage, 
    progress,
    loadData: loadWorkerData 
  } = useDataWorker();

  // Minimal state - only what's needed for virtual scrolling
  const [visibleVerses, setVisibleVerses] = useState<any[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize worker data loading
  useEffect(() => {
    if (!workerReady && !workerLoading) {
      loadWorkerData();
    }
  }, [workerReady, workerLoading, loadWorkerData]);

  // Virtual scrolling logic - only render visible verses
  useEffect(() => {
    if (!scrollContainerRef.current || !workerReady) return;

    const ROW_HEIGHT = 120;
    const BUFFER_SIZE = 50; // Small buffer for smooth scrolling
    const TOTAL_VERSES = 31102;
    const container = scrollContainerRef.current;
    
    const updateVisibleVerses = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      
      const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
      const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / ROW_HEIGHT),
        TOTAL_VERSES
      );
      
      const visibleStartIndex = Math.max(0, startIndex - BUFFER_SIZE);
      const visibleEndIndex = Math.min(TOTAL_VERSES, endIndex + BUFFER_SIZE);
      
      // Create minimal verse objects on demand
      const newVisibleVerses = [];
      for (let i = visibleStartIndex; i < visibleEndIndex; i++) {
        const reference = `Verse.${Math.floor(i/100)+1}:${(i%100)+1}`; // Placeholder
        newVisibleVerses.push({
          index: i,
          reference,
          top: i * ROW_HEIGHT,
          text: getVerseText(reference) // Get from worker data
        });
      }
      
      setVisibleVerses(newVisibleVerses);
      setScrollPosition(scrollTop);
    };

    updateVisibleVerses();
    
    const handleScroll = () => {
      requestAnimationFrame(updateVisibleVerses);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [workerReady]);

  // Get verse text from worker data
  const getVerseText = (reference: string): string => {
    if (!workerReady) return 'Loading...';
    
    const translationData = (window as any).translationData;
    return translationData?.KJV?.[reference] || `[${reference} - text loading...]`;
  };

  // Get cross-references from worker data
  const getCrossRefs = (reference: string): string => {
    if (!workerReady) return '';
    
    const crossRefSets = (window as any).crossRefSets;
    const refs = crossRefSets?.default?.[reference] || [];
    
    return refs
      .slice(0, 3) // Limit to 3 refs for memory efficiency
      .map((ref: string) => `<a href="#" onclick="alert('Jump to ${ref}')">${ref}</a>`)
      .join('<br>');
  };

  const renderVirtualRow = (verse: any) => {
    const { reference, top, text } = verse;
    
    return (
      <div
        key={`${reference}-${top}`}
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
            {text}
          </div>
        </div>
        
        {/* Cross-references column */}
        <div 
          className="w-48 px-2 text-xs overflow-y-auto text-blue-600 dark:text-blue-400"
          dangerouslySetInnerHTML={{ __html: getCrossRefs(reference) }}
        />
      </div>
    );
  };

  // Show loading screen
  if (workerLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingWheel 
          message={`${loadingStage} (${progress}%)`}
          size="large"
        />
      </div>
    );
  }

  const totalHeight = 31102 * 120; // Total height for scrollbar

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Bible Study (Memory Optimized)
        </h1>
        {workerReady && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Data loaded - Memory optimized with virtual scrolling
          </p>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden">
        {/* Fixed column headers */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex">
          <div className="w-24 flex-shrink-0 px-2 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
            Reference
          </div>
          <div className="flex-1 px-2 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
            KJV Text
          </div>
          <div className="w-48 px-2 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
            Cross-References
          </div>
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
    </div>
  );
}