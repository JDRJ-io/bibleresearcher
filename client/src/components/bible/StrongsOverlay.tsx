import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Languages, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useStrongsWorker } from "@/hooks/useStrongsWorker";
import type { BibleVerse } from "@/types/bible";

interface StrongsWord {
  original: string;
  transliteration: string;
  strongs: string;
  definition: string;
  pronunciation: string;
}

interface StrongsOverlayProps {
  verse: BibleVerse | null;
  onClose: () => void;
  onNavigateToVerse?: (reference: string) => void;
}

export function StrongsOverlay({ verse, onClose, onNavigateToVerse }: StrongsOverlayProps) {
  const [selectedWord, setSelectedWord] = useState<StrongsWord | null>(null);
  const [strongsData, setStrongsData] = useState<StrongsWord[]>([]);
  const [relatedVerses, setRelatedVerses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingWord, setLoadingWord] = useState(false);

  const { getVerseStrongsData, getLemmaVerses, isReady } = useStrongsWorker();

  // Load Strong's data for the verse when the overlay opens
  useEffect(() => {
    if (verse && isReady) {
      console.log(`🔍 Loading Strong's data for ${verse.reference}...`);
      setIsLoading(true);
      
      getVerseStrongsData(verse.reference)
        .then((data) => {
          console.log(`✅ Loaded ${data.words.length} Strong's words for ${verse.reference}`);
          setStrongsData(data.words);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('❌ Failed to load Strong\'s data:', error);
          setStrongsData([]);
          setIsLoading(false);
        });
    }
  }, [verse, isReady, getVerseStrongsData]);

  const handleWordClick = async (word: StrongsWord) => {
    setSelectedWord(word);
    setLoadingWord(true);
    setRelatedVerses([]);

    console.log(`🔍 Loading related verses for Strong's ${word.strongs}...`);

    try {
      const verses = await getLemmaVerses(word.strongs);
      console.log(`✅ Found ${verses.length} verses containing ${word.strongs}`);
      setRelatedVerses(verses);
    } catch (error) {
      console.error('❌ Failed to load related verses:', error);
      setRelatedVerses([]);
    } finally {
      setLoadingWord(false);
    }
  };

  const handleVerseNavigation = (reference: string) => {
    if (onNavigateToVerse) {
      onNavigateToVerse(reference);
      onClose(); // Close overlay after navigation
    }
  };

  if (!verse) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Languages className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Strong's Concordance
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {verse.reference} - Original Language Analysis
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex h-[calc(90vh-120px)]">
            {/* Left Panel - Interlinear Words */}
            <div className="w-1/2 border-r border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Interlinear Text
                </h3>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading original words...</span>
                  </div>
                ) : strongsData.length > 0 ? (
                  <ScrollArea className="h-[calc(90vh-220px)]">
                    <div className="grid grid-cols-2 gap-3">
                      {strongsData.map((word, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedWord?.strongs === word.strongs
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          onClick={() => handleWordClick(word)}
                        >
                          <div className="text-center space-y-2">
                            <div className="font-hebrew text-lg font-bold text-gray-900 dark:text-white">
                              {word.original}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {word.strongs}
                            </Badge>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {word.transliteration}
                            </div>
                            {word.pronunciation && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 italic">
                                /{word.pronunciation}/
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <Languages className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No Strong's data available for this verse
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Word Details and Related Verses */}
            <div className="w-1/2">
              <div className="p-6">
                {selectedWord ? (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Word Details
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-hebrew text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedWord.original}
                          </span>
                          <Badge variant="outline">{selectedWord.strongs}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Transliteration:</strong> {selectedWord.transliteration}
                        </div>
                        {selectedWord.pronunciation && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Pronunciation:</strong> /{selectedWord.pronunciation}/
                          </div>
                        )}
                        <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                          <strong>Definition:</strong> {selectedWord.definition}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Related Verses
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Search className="w-4 h-4 mr-1" />
                          {loadingWord ? 'Searching...' : `${relatedVerses.length} found`}
                        </div>
                      </div>

                      {loadingWord ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      ) : relatedVerses.length > 0 ? (
                        <ScrollArea className="h-[calc(90vh-420px)]">
                          <div className="space-y-2">
                            {relatedVerses.slice(0, 50).map((reference, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                                onClick={() => handleVerseNavigation(reference)}
                              >
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {reference}
                                </span>
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                              </div>
                            ))}
                            {relatedVerses.length > 50 && (
                              <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                                ... and {relatedVerses.length - 50} more verses
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-8">
                          <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            No related verses found
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <Languages className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Select a Word
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Click on any word from the interlinear text to view its definition and find related verses.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}