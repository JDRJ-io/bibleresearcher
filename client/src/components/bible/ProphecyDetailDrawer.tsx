import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Zap, CheckCircle, ExternalLink } from 'lucide-react';
import { LoadingWheel } from '@/components/LoadingWheel';

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
  const [prophecyDetails, setProphecyDetails] = useState<ProphecyDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('predictions');

  useEffect(() => {
    if (isOpen && prophecyIds.length > 0) {
      loadProphecyDetails();
    }
  }, [isOpen, prophecyIds]);

  const loadProphecyDetails = async () => {
    setIsLoading(true);
    try {
      // This would typically load from BibleDataAPI
      // For now, using mock data structure that matches the expected format
      const details: ProphecyDetail[] = prophecyIds.map(id => ({
        id: id.toString(),
        summary: `Prophecy ${id}: Sample prophecy description about future events`,
        prophecy: [`Sample.1:${id}`, `Sample.2:${id}`],
        fulfillment: [`Fulfilled.1:${id}`, `Fulfilled.2:${id}`],
        verification: [`Verify.1:${id}`, `Verify.2:${id}`]
      }));

      setProphecyDetails(details);
    } catch (error) {
      console.error('Failed to load prophecy details:', error);
      setProphecyDetails([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerseClick = (verseReference: string) => {
    onNavigateToVerse(verseReference);
    onClose();
  };

  const renderVerseList = (verses: string[], icon: React.ReactNode, emptyMessage: string) => (
    <div className="space-y-2">
      {verses.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">{emptyMessage}</p>
      ) : (
        verses.map((verse, index) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full justify-start h-auto p-3 text-left"
            onClick={() => handleVerseClick(verse)}
          >
            <div className="flex items-start gap-3 w-full">
              {icon}
              <div className="flex-1">
                <div className="font-medium text-sm">{verse}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Click to navigate to this verse
                </div>
              </div>
              <ExternalLink className="w-4 h-4 opacity-50" />
            </div>
          </Button>
        ))
      )}
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg text-foreground">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Zap className="w-5 h-5" />
            Prophecy Details
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Explore the predictions, fulfillments, and verification verses
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingWheel size="large" />
            <span className="ml-2">Loading prophecy details...</span>
          </div>
        ) : (
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
        )}
      </SheetContent>
    </Sheet>
  );
}