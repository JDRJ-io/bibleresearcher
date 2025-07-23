
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
  console.log('🔍 StrongsOverlay render - verse:', verse?.reference, 'isOpen:', !!verse);
  
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Languages className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">{verse.reference}</h2>
                <p className="text-blue-100 text-sm">Strong's Concordance - Original Language Analysis</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex h-[calc(95vh-120px)]">
            {/* Left Panel - Interlinear Text */}
            <div className="flex-[2] border-r border-gray-200 dark:border-gray-700 min-w-0">
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium mr-4">
                    Interlinear Analysis
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Original Language Words
                  </h3>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Loading original language data...</p>
                    </div>
                  </div>
                ) : strongsData.length > 0 ? (
                  <ScrollArea className="flex-1">
                    <div className="space-y-4 pr-4">
                      {/* English Verse Text */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center mb-3">
                          <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium mr-3">
                            ENGLISH
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{verse.reference}</span>
                        </div>
                        <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                          {verse.text || 'Verse text not available'}
                        </p>
                      </div>

                      {/* Original Language Words Grid */}
                      <div className="grid gap-4">
                        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                          <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-medium mr-4">
                            ORIGINAL WORDS
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {strongsData.length} words analyzed
                          </span>
                        </div>
                        
                        {strongsData.map((word, index) => (
                          <motion.div
                            key={index}
                            className={`group relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                              selectedWord?.strongs === word.strongs
                                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 shadow-lg'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                            }`}
                            onClick={() => handleWordClick(word)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Word Position Badge */}
                            <div className="absolute top-3 right-3">
                              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full font-mono">
                                #{index + 1}
                              </span>
                            </div>
                            
                            {/* Main Word Display */}
                            <div className="mb-4">
                              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2 font-hebrew">
                                {word.original}
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {word.strongs}
                                </Badge>
                                <span className="text-sm text-gray-600 dark:text-gray-400 italic font-medium">
                                  {word.transliteration}
                                </span>
                                {word.pronunciation && (
                                  <span className="text-xs text-gray-500 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                    /{word.pronunciation}/
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Definition Preview */}
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {word.definition || 'Definition not available'}
                              </p>
                            </div>
                            
                            {/* Selection Indicator */}
                            {selectedWord?.strongs === word.strongs && (
                              <div className="absolute top-3 left-3">
                                <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                  Selected
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center flex-1">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <Languages className="w-20 h-20 mx-auto mb-4 opacity-30" />
                      <h4 className="text-xl font-semibold mb-2">No Strong's Data</h4>
                      <p className="text-sm">Original language data not available for this verse</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Selected Word Details */}
            <div className="w-96 bg-gray-50 dark:bg-gray-800">
              <div className="p-6 h-full flex flex-col">
                {selectedWord ? (
                  <div className="h-full flex flex-col">
                    {/* Word Details Card */}
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                      <div className="text-center mb-5">
                        <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-3 font-hebrew">
                          {selectedWord.original}
                        </div>
                        <Badge variant="secondary" className="mb-2">{selectedWord.strongs}</Badge>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Transliteration:</span>
                          <span className="text-gray-800 dark:text-gray-200 font-semibold">{selectedWord.transliteration}</span>
                        </div>
                        {selectedWord.pronunciation && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Pronunciation:</span>
                            <span className="text-gray-800 dark:text-gray-200 font-mono">/{selectedWord.pronunciation}/</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-600">
                        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Complete Definition:</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          {selectedWord.definition}
                        </p>
                      </div>
                    </div>

                    {/* Related Verses Section */}
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="flex items-center mb-4">
                        <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium mr-4">
                          Related Verses
                        </div>
                        {relatedVerses.length > 0 && (
                          <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                            {relatedVerses.length} found
                          </span>
                        )}
                      </div>
                      
                      {loadingWord ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Loading related verses...</p>
                          </div>
                        </div>
                      ) : relatedVerses.length > 0 ? (
                        <ScrollArea className="flex-1">
                          <div className="space-y-2 pr-2">
                            {relatedVerses.slice(0, 100).map((verseRef, index) => (
                              <button
                                key={index}
                                className="w-full text-left p-3 text-sm bg-white dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-600 transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 group"
                                onClick={() => handleVerseNavigation(verseRef)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-blue-600 dark:text-blue-400 font-medium">{verseRef}</span>
                                  <ExternalLink className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </button>
                            ))}
                            {relatedVerses.length > 100 && (
                              <div className="text-xs text-gray-500 text-center py-4 border-t border-gray-200 dark:border-gray-600">
                                +{relatedVerses.length - 100} more verses with this word
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                          <div className="text-center">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No related verses found</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <Search className="w-20 h-20 mx-auto mb-4 opacity-30" />
                      <h4 className="text-xl font-semibold mb-2">Select a Word</h4>
                      <p className="text-sm leading-relaxed max-w-xs">
                        Click any original language word on the left to see its detailed definition and find other Bible verses containing this word
                      </p>
                    </div>
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
