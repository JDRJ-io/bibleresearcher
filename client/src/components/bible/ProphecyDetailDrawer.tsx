import React, { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Zap, CheckCircle, ExternalLink } from 'lucide-react';
import { LoadingWheel } from '@/components/LoadingWheel';
import { useBibleStore } from '@/App';
import { VerseText } from '@/components/highlights/VerseText';
import { expandVerseRange, getFirstVerseFromRange, isVerseRange } from '@/lib/verseRangeUtils';

interface ProphecyDetail {
  id: string;
  summary: string;
  prophecy: string[];
  fulfillment: string[];
  verification: string[];
}

interface ProphecyDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  prophecyIds: number[];
  onNavigateToVerse: (verseReference: string) => void;
}

export function ProphecyDetailDrawer({ 
  isOpen, 
  onClose, 
  prophecyIds, 
  onNavigateToVerse 
}: ProphecyDetailDrawerProps) {
  const store = useBibleStore();
  const [activeTab, setActiveTab] = useState('predictions');

  const prophecyDetails = useMemo(() => {
    if (!prophecyIds.length) return [];
    
    const prophecyIndex = store.prophecyIndex;
    if (!prophecyIndex) return [];
    
    return prophecyIds
      .map(id => {
        const prophecy = prophecyIndex[id];
        if (!prophecy) return null;
        
        return {
          id: id.toString(),
          summary: prophecy.summary || `Prophecy ${id}`,
          prophecy: prophecy.prophecy || [],
          fulfillment: prophecy.fulfillment || [],
          verification: prophecy.verification || []
        };
      })
      .filter((p): p is ProphecyDetail => p !== null);
  }, [prophecyIds, store.prophecyIndex]);

  const handleVerseClick = (verseReference: string) => {
    onNavigateToVerse(verseReference);
    onClose();
  };

  const renderVerseList = (verses: string[], icon: React.ReactNode, emptyMessage: string) => {
    const mainTranslation = store.actives[0] || 'KJV';
    const translationData = store.translations[mainTranslation];
    
    const getVerseText = (verseID: string): string | undefined => {
      if (!translationData?.verses) return undefined;
      const verse = translationData.verses.find((v: any) => v.reference === verseID);
      return verse?.text || undefined;
    };

    return (
      <div className="space-y-2">
        {verses.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">{emptyMessage}</p>
        ) : (
          verses.map((verseRef, index) => {
            // Check if this is a verse range (e.g., "Gen.7:17-23")
            const isRange = isVerseRange(verseRef);
            const displayRef = verseRef;
            const navigationRef = isRange ? getFirstVerseFromRange(verseRef) : verseRef;
            
            // For ranges, expand to get all verse references and combine their text
            const verseRefs = isRange ? expandVerseRange(verseRef) : [verseRef];
            
            return (
              <div
                key={index}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <button
                  type="button"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-mono font-semibold text-sm mb-1 block"
                  onClick={() => handleVerseClick(navigationRef)}
                  title={isRange ? `Jump to ${navigationRef}` : undefined}
                >
                  {displayRef}
                </button>
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                  {verseRefs.map((singleVerseRef, verseIdx) => {
                    const verseText = getVerseText(singleVerseRef) || '';
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
          })
        )}
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Prophecy Details
          </SheetTitle>
          <SheetDescription>
            Explore the predictions, fulfillments, and verification verses
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {prophecyDetails.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No prophecy details available</p>
            </div>
          ) : (
              <div className="space-y-6">
                {/* Prophecy Summaries */}
                <div className="space-y-3">
                  {prophecyDetails.map((prophecy, index) => (
                    <div key={prophecy.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">ID {prophecy.id}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {prophecy.summary}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Tabbed Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="predictions" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Predictions
                    </TabsTrigger>
                    <TabsTrigger value="fulfillments" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Fulfillments
                    </TabsTrigger>
                    <TabsTrigger value="verifications" className="text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      Verifications
                    </TabsTrigger>
                  </TabsList>

                  <ScrollArea className="h-[400px] mt-4">
                    <TabsContent value="predictions" className="space-y-4">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Original Prophecy Verses
                      </div>
                      {prophecyDetails.map((prophecy) =>
                        renderVerseList(
                          prophecy.prophecy,
                          <Eye className="w-4 h-4 text-blue-500 mt-0.5" />,
                          "No prediction verses available"
                        )
                      )}
                    </TabsContent>

                    <TabsContent value="fulfillments" className="space-y-4">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Fulfillment Verses
                      </div>
                      {prophecyDetails.map((prophecy) =>
                        renderVerseList(
                          prophecy.fulfillment,
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />,
                          "No fulfillment verses available"
                        )
                      )}
                    </TabsContent>

                    <TabsContent value="verifications" className="space-y-4">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Supporting Evidence
                      </div>
                      {prophecyDetails.map((prophecy) =>
                        renderVerseList(
                          prophecy.verification,
                          <Zap className="w-4 h-4 text-yellow-500 mt-0.5" />,
                          "No verification verses available"
                        )
                      )}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </div>
            )}
          </div>
      </SheetContent>
    </Sheet>
  );
}