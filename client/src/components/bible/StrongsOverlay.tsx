
import { useState, useEffect } from 'react';
import type { BibleVerse, StrongsWord } from '@/types/bible';
import { X, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { strongsService, type StrongsOccurrence, type InterlinearCell } from '@/lib/strongsService';
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useBibleStore } from '@/App';

interface StrongsOverlayProps {
  verse: BibleVerse | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVerse?: (reference: string) => void;
}

export function StrongsOverlay({ verse, isOpen, onClose, onNavigateToVerse }: StrongsOverlayProps) {
  const [strongsWords, setStrongsWords] = useState<StrongsWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<StrongsWord | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // New state for Range request data
  const [interlinearCells, setInterlinearCells] = useState<InterlinearCell[]>([]);
  const [selectedOccurrences, setSelectedOccurrences] = useState<StrongsOccurrence[]>([]);

  const { store } = useBibleStore();
  const allVerses = store.verses || [];

  const loadStrongsData = async (verse: BibleVerse) => {
    setLoading(true);
    try {
      console.log(`🔍 Loading Strong's data via new Range system for ${verse.reference}`);
      
      const referenceFormats = [
        verse.reference,
        verse.reference.replace(/\s/g, '.'),
        verse.reference.replace(/\./g, ' '),
        verse.reference.replace(/\s+/g, '.'),
        verse.reference.replace('Genesis', 'Gen').replace(/\s/g, '.'),
        verse.reference.replace('Gen ', 'Gen.'),
      ];
      
      let verseData = null;
      for (const refFormat of referenceFormats) {
        verseData = await strongsService.getVerseStrongsData(refFormat);
        if (verseData && verseData.words.length > 0) {
          console.log(`✅ Found Strong's data using format: ${refFormat}`);
          break;
        }
      }

      if (verseData && verseData.words.length > 0) {
        setStrongsWords(verseData.words);
        setInterlinearCells(verseData.interlinearCells);
        console.log(`✅ Loaded ${verseData.words.length} Strong's words for ${verse.reference}`);
      } else {
        console.log(`❌ No Strong's data found for ${verse.reference} in any format`);
        setStrongsWords([]);
        setInterlinearCells([]);
      }
    } catch (error) {
      console.error('Error loading Strong\'s data:', error);
      setStrongsWords([]);
      setInterlinearCells([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (verse) {
      loadStrongsData(verse);
      setSelectedWord(null);
      setSelectedOccurrences([]);
      setShowSearch(false);
      setSearchQuery('');
    }
  }, [verse]);

  const handleWordClick = async (word: StrongsWord) => {
    const isCurrentlySelected = selectedWord?.strongs === word.strongs;
    setSelectedWord(isCurrentlySelected ? null : word);

    if (!isCurrentlySelected) {
      try {
        console.log(`🔍 Loading occurrences for Strong's ${word.strongs}`);
        const occurrences = await strongsService.getStrongsOccurrences(word.strongs);
        setSelectedOccurrences(occurrences);
        setShowSearch(true);
        console.log(`✅ Loaded ${occurrences.length} occurrences for Strong's ${word.strongs}`);
      } catch (error) {
        console.error(`❌ Error loading occurrences for ${word.strongs}:`, error);
        setSelectedOccurrences([]);
      }
    } else {
      setSelectedOccurrences([]);
      setShowSearch(false);
    }
  };

  const navigateToAdjacentVerse = (direction: 'up' | 'down') => {
    if (!verse || !allVerses.length) return;
    
    const currentIndex = allVerses.findIndex(v => v.reference === verse.reference);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < allVerses.length) {
      const newVerse = allVerses[newIndex];
      onNavigateToVerse?.(newVerse.reference);
    }
  };

  const filteredOccurrences = selectedOccurrences.filter(occ => 
    !searchQuery || occ.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    occ.context?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

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
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Navigation */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Strong's Concordance</h2>
              {verse && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToAdjacentVerse('up')}
                    className="w-8 h-8 p-0"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToAdjacentVerse('down')}
                    className="w-8 h-8 p-0"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:bg-gray-100 rounded-full w-8 h-8 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {verse && (
            <>
              {/* Expanded Verse Display */}
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-b">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="outline" className="font-mono text-sm">
                    {verse.reference}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Strong's Interlinear Analysis
                  </span>
                </div>
                <div className="text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                  {verse.text?.KJV || verse.text?.[Object.keys(verse.text)[0]] || 'Loading verse text...'}
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Strong's Words Grid */}
                <div className="flex-1 p-6">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Loading Strong's data...</p>
                      </div>
                    </div>
                  ) : interlinearCells.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Hebrew/Greek Word Analysis</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {interlinearCells.map((cell, index) => (
                          <div
                            key={index}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              selectedWord?.strongs === cell.strongsKey
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                            onClick={async () => {
                              const word: StrongsWord = {
                                original: cell.original,
                                strongs: cell.strongsKey,
                                transliteration: cell.transliteration,
                                definition: cell.gloss,
                                instances: [],
                                morphology: cell.morphology
                              };
                              await handleWordClick(word);
                            }}
                          >
                            {/* Original Word */}
                            <div className="text-center mb-3">
                              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                                {cell.original}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 italic">
                                {cell.transliteration}
                              </div>
                            </div>

                            {/* Strong's Number */}
                            <div className="text-center mb-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {cell.strongsKey}
                              </Badge>
                            </div>

                            {/* Definition */}
                            <div className="text-sm text-gray-700 dark:text-gray-300 text-center mb-2 leading-relaxed">
                              {cell.gloss}
                            </div>

                            {/* Morphology */}
                            {cell.morphology && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 text-center border-t pt-2">
                                {cell.morphology}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          No Strong's data available for this verse
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Reference: {verse.reference}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Panel - Search Results */}
                {showSearch && selectedWord && (
                  <>
                    <Separator orientation="vertical" />
                    <div className="w-96 flex flex-col">
                      <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="font-mono">{selectedWord.strongs}</Badge>
                          <span className="font-semibold text-lg">{selectedWord.original}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-2">
                          {selectedWord.transliteration}
                        </p>
                        <p className="text-sm leading-relaxed">{selectedWord.definition}</p>
                      </div>

                      <div className="p-4 border-b">
                        <div className="flex items-center gap-2 mb-2">
                          <Search className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            Search {selectedOccurrences.length} occurrences
                          </span>
                        </div>
                        <Input
                          placeholder="Filter verses..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="text-sm"
                        />
                      </div>

                      <ScrollArea className="flex-1">
                        <div className="p-4 space-y-2">
                          {filteredOccurrences.length > 0 ? (
                            filteredOccurrences.map((occurrence, index) => (
                              <button
                                key={`${occurrence.reference}-${index}`}
                                onClick={() => {
                                  onNavigateToVerse?.(occurrence.reference);
                                  onClose();
                                }}
                                className="w-full text-left p-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                              >
                                <div className="font-medium text-blue-600 hover:text-blue-800 mb-1">
                                  {occurrence.reference}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  <span className="font-medium">{occurrence.original}</span> • 
                                  <span className="italic mx-1">{occurrence.transliteration}</span> • 
                                  <span>{occurrence.gloss}</span>
                                </div>
                                {occurrence.context && (
                                  <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed break-words">
                                    {occurrence.context}
                                  </div>
                                )}
                              </button>
                            ))
                          ) : searchQuery ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-8">
                              No occurrences match "{searchQuery}"
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-8">
                              Loading occurrences...
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
