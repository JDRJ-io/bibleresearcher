import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap } from 'lucide-react';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { VerseText } from '@/components/highlights/VerseText';
import { expandVerseRange, getFirstVerseFromRange, isVerseRange } from '@/lib/verseRangeUtils';
import { useLandscapeSidecar } from '@/hooks/useLandscapeSidecar';

interface ProphecyTableOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVerse?: (verseRef: string) => void;
}

export function ProphecyTableOverlay({ isOpen, onClose, onNavigateToVerse }: ProphecyTableOverlayProps) {
  const store = useBibleStore();
  const { prophecyIndex } = store;
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'prediction' | 'fulfillment' | 'verification'>('prediction');
  const [isLoading, setIsLoading] = useState(false);

  // Use the shared translation maps hook to get getVerseText
  const { mainTranslation, getVerseText } = useTranslationMaps();
  const isLandscape = useLandscapeSidecar();

  useEffect(() => {
    if (isOpen && (!prophecyIndex || Object.keys(prophecyIndex).length === 0)) {
      loadProphecyData();
    }
  }, [isOpen, prophecyIndex]);

  const loadProphecyData = async () => {
    try {
      setIsLoading(true);
      // Use the same approach as toggleProphecies - load and update store
      const { loadProphecyData } = await import('@/data/BibleDataAPI');
      const { verseRoles, prophecyIndex } = await loadProphecyData();
      
      // Update the store just like toggleProphecies does
      store.setProphecyData(verseRoles);
      store.setProphecyIndex(prophecyIndex);
    } catch (error) {
      console.error('Failed to load prophecy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProphecyClick = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setActiveTab('prediction');
    }
  };

  const handleVerseClick = (verseRef: string) => {
    if (onNavigateToVerse) {
      onNavigateToVerse(verseRef);
      onClose();
    }
  };

  const prophecyEntries = prophecyIndex 
    ? Object.entries(prophecyIndex).map(([id, data]) => ({ id: Number(id), ...data }))
    : [];

  // Render verse list with text (same format as UnifiedProphecyCell)
  const renderVerseList = (verses: string[], testIdPrefix: string) => {
    if (!verses || verses.length === 0) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No verses available
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {verses.map((verseRef, idx) => {
          // Check if this is a verse range (e.g., "Gen.7:17-23")
          const isRange = isVerseRange(verseRef);
          const displayRef = verseRef;
          const navigationRef = isRange ? getFirstVerseFromRange(verseRef) : verseRef;
          
          // For ranges, expand to get all verse references and combine their text
          const verseRefs = isRange ? expandVerseRange(verseRef) : [verseRef];
          
          return (
            <div 
              key={idx} 
              className="px-3 py-2 space-y-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <button
                type="button"
                className="text-blue-600 dark:text-blue-400 hover:underline font-mono font-semibold text-sm"
                onClick={() => handleVerseClick(navigationRef)}
                data-testid={`${testIdPrefix}-${idx}`}
                title={isRange ? `Jump to ${navigationRef}` : undefined}
              >
                {displayRef}
              </button>
              <div className="text-sm text-gray-700 dark:text-gray-300 leading-tight whitespace-normal break-words">
                {verseRefs.map((singleVerseRef, verseIdx) => {
                  const verseText = getVerseText(singleVerseRef, mainTranslation) || '';
                  if (!verseText) return null;
                  
                  return (
                    <span key={verseIdx}>
                      {verseIdx > 0 && ' '}
                      <VerseText
                        verseRef={singleVerseRef}
                        translation={mainTranslation}
                        text={verseText}
                      />
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <style>{`
        .prophecy-overlay-scroll::-webkit-scrollbar {
          width: 12px;
        }
        .prophecy-overlay-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 6px;
        }
        .prophecy-overlay-scroll::-webkit-scrollbar-thumb {
          background: rgba(100, 100, 120, 0.5);
          border-radius: 6px;
          min-height: 60px;
        }
        .prophecy-overlay-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 100, 120, 0.7);
        }
        .dark .prophecy-overlay-scroll::-webkit-scrollbar-thumb {
          background: rgba(200, 200, 220, 0.4);
        }
        .dark .prophecy-overlay-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(200, 200, 220, 0.6);
        }
      `}</style>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Zap className="w-5 h-5" />
              All Prophecies ({prophecyEntries.length})
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Browse all biblical prophecies. Click on any prophecy to view detailed predictions, fulfillments, and verification verses.
            </DialogDescription>
          </DialogHeader>

        <ScrollArea className="flex-1 pr-4 prophecy-scrollarea">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <Zap className="w-12 h-12 mx-auto mb-2 opacity-50 animate-pulse" />
                <p>Loading prophecy data...</p>
              </div>
            ) : prophecyEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No prophecy data loaded</p>
              </div>
            ) : (
              prophecyEntries.map(({ id, summary, prophecy, fulfillment, verification }) => {
                const isExpanded = expandedId === id;
                
                return (
                  <div 
                    key={id} 
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => handleProphecyClick(id)}
                      className={`w-full flex items-start text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isLandscape ? "px-2 py-2 gap-2" : "px-4 py-3 gap-3"}`}
                      data-testid={`prophecy-row-${id}`}
                    >
                      <div className="flex-shrink-0 font-bold text-gray-700 dark:text-gray-300">
                        #{id}
                      </div>
                      <div className="flex-1 text-sm text-gray-800 dark:text-gray-200">
                        {summary}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className={`border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 ${isLandscape ? "p-2" : "p-4"}`}>
                        {/* Tab Buttons */}
                        <div className={`flex gap-2 ${isLandscape ? "mb-2" : "mb-4"}`}>
                          <button
                            onClick={() => setActiveTab('prediction')}
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              activeTab === 'prediction'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                            data-testid={`tab-prediction-${id}`}
                          >
                            Prediction
                          </button>
                          <button
                            onClick={() => setActiveTab('fulfillment')}
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              activeTab === 'fulfillment'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                            data-testid={`tab-fulfillment-${id}`}
                          >
                            Fulfillment
                          </button>
                          <button
                            onClick={() => setActiveTab('verification')}
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              activeTab === 'verification'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                            data-testid={`tab-verification-${id}`}
                          >
                            Verification
                          </button>
                        </div>

                        {/* Tab Content - Display verses with text in scrollable area */}
                        <div className="max-h-[400px] overflow-y-auto pr-2 border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-900 prophecy-overlay-scroll">
                          {activeTab === 'prediction' && renderVerseList(prophecy || [], `prophecy-verse-${id}`)}
                          {activeTab === 'fulfillment' && renderVerseList(fulfillment || [], `fulfillment-verse-${id}`)}
                          {activeTab === 'verification' && renderVerseList(verification || [], `verification-verse-${id}`)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
    </>
  );
}
