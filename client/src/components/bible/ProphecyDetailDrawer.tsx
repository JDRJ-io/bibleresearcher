import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getProphecyIndex } from "@/data/BibleDataAPI";

interface ProphecyDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  prophecyIds: string[];
  type: 'P' | 'F' | 'V';
  verseReference: string;
  onNavigateToVerse: (reference: string) => void;
}

interface ProphecyDetail {
  id: string;
  summary: string;
  prophecy: string[];
  fulfillment: string[];
  verification: string[];
}

export function ProphecyDetailDrawer({
  isOpen,
  onClose,
  prophecyIds,
  type,
  verseReference,
  onNavigateToVerse
}: ProphecyDetailDrawerProps) {
  const [prophecyDetails, setProphecyDetails] = useState<ProphecyDetail[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && prophecyIds.length > 0) {
      loadProphecyDetails();
    }
  }, [isOpen, prophecyIds]);

  const loadProphecyDetails = async () => {
    setLoading(true);
    try {
      const prophecyIndex = await getProphecyIndex();
      const details = prophecyIds.map(id => {
        const prophecy = prophecyIndex[id];
        return prophecy ? {
          id,
          summary: prophecy.summary || `Prophecy ${id}`,
          prophecy: prophecy.prophecy || [],
          fulfillment: prophecy.fulfillment || [],
          verification: prophecy.verification || []
        } : null;
      }).filter(Boolean) as ProphecyDetail[];
      
      setProphecyDetails(details);
      console.log(`✅ Loaded ${details.length} prophecy details for ${type} type`);
    } catch (error) {
      console.error('❌ Failed to load prophecy details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'P': return 'Predictions';
      case 'F': return 'Fulfillments';
      case 'V': return 'Verifications';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'P': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'F': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'V': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge className={getTypeColor(type)}>
              {getTypeLabel(type)}
            </Badge>
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
              for {verseReference}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading prophecy details...</p>
              </div>
            </div>
          ) : prophecyDetails.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">No prophecy details found</p>
            </div>
          ) : (
            <Tabs defaultValue="0" className="h-full flex flex-col">
              <TabsList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 h-auto p-1">
                {prophecyDetails.map((prophecy, index) => (
                  <TabsTrigger
                    key={prophecy.id}
                    value={index.toString()}
                    className="text-xs p-2 text-left truncate"
                    title={prophecy.summary}
                  >
                    #{prophecy.id}: {prophecy.summary}
                  </TabsTrigger>
                ))}
              </TabsList>

              {prophecyDetails.map((prophecy, index) => (
                <TabsContent key={prophecy.id} value={index.toString()} className="flex-1 mt-4">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-6">
                      {/* Summary */}
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Summary</h3>
                        <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          {prophecy.summary}
                        </p>
                      </div>

                      {/* Predictions */}
                      {prophecy.prophecy.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Predictions
                            </Badge>
                            <span className="text-sm text-gray-500">({prophecy.prophecy.length})</span>
                          </h3>
                          <div className="space-y-2">
                            {prophecy.prophecy.map((ref, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="justify-start text-left h-auto p-3 w-full"
                                onClick={() => {
                                  onNavigateToVerse(ref);
                                  onClose();
                                }}
                              >
                                <span className="font-mono text-blue-600 dark:text-blue-400 mr-2">
                                  {ref}
                                </span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fulfillments */}
                      {prophecy.fulfillment.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Fulfillments
                            </Badge>
                            <span className="text-sm text-gray-500">({prophecy.fulfillment.length})</span>
                          </h3>
                          <div className="space-y-2">
                            {prophecy.fulfillment.map((ref, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="justify-start text-left h-auto p-3 w-full"
                                onClick={() => {
                                  onNavigateToVerse(ref);
                                  onClose();
                                }}
                              >
                                <span className="font-mono text-green-600 dark:text-green-400 mr-2">
                                  {ref}
                                </span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Verifications */}
                      {prophecy.verification.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              Verifications
                            </Badge>
                            <span className="text-sm text-gray-500">({prophecy.verification.length})</span>
                          </h3>
                          <div className="space-y-2">
                            {prophecy.verification.map((ref, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="justify-start text-left h-auto p-3 w-full"
                                onClick={() => {
                                  onNavigateToVerse(ref);
                                  onClose();
                                }}
                              >
                                <span className="font-mono text-purple-600 dark:text-purple-400 mr-2">
                                  {ref}
                                </span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}