
import { useState, useEffect, useMemo } from 'react';
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
import './StrongsOverlay.css';

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

  // Expert's recommended clean cursor-based navigation
  const [currentStrongsId, setCurrentStrongsId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<number>(0);

  const { store } = useBibleStore();
  const allVerses = store.verses || [];

  // Expert's Step 1: Keep a clean occurrence list
  const occurrences = useMemo(() => {
    if (!currentStrongsId || !selectedOccurrences.length) return [];
    return selectedOccurrences.map(occ => occ.reference);
  }, [currentStrongsId, selectedOccurrences]);

  // Debug logging for expert's diagnostic
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__debugStrongs = { occurrences, cursor };
    }
  }, [occurrences, cursor]);



  const loadStrongsData = async (verse: BibleVerse) => {
    setLoading(true);
    try {
      console.log(`🔍 Loading Strong's data via new Range system for ${verse.reference}`);
      
      // OPTIMIZATION: verse.reference now uses dot format "Gen.1:1" - matches Strong's files directly
      const referenceFormats = [
        verse.reference, // Primary format: "Gen.1:1" - matches Strong's files
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
      console.log(`🔍 StrongsOverlay received new verse prop: ${verse.reference}`);
      loadStrongsData(verse);
      setSelectedWord(null);
      setSelectedOccurrences([]);
      setShowSearch(false);
      setSearchQuery('');
    }
  }, [verse?.id, verse?.reference]); // Use both id and reference to ensure proper updates

  const handleWordClick = async (word: StrongsWord) => {
    const isCurrentlySelected = selectedWord?.strongs === word.strongs;
    setSelectedWord(isCurrentlySelected ? null : word);

    if (!isCurrentlySelected) {
      try {
        console.log(`🔍 Loading occurrences for Strong's ${word.strongs}`);
        const occurrences = await strongsService.getStrongsOccurrences(word.strongs);
        setSelectedOccurrences(occurrences);
        
        // Expert's Step 1: Set up clean occurrence tracking
        setCurrentStrongsId(word.strongs);
        setCursor(0); // Reset cursor to first occurrence
        
        setShowSearch(true);
        console.log(`✅ Loaded ${occurrences.length} occurrences for Strong's ${word.strongs}`);
        console.log(`📋 Expert tracking setup: strongsId=${word.strongs}, cursor=0`);
      } catch (error) {
        console.error(`❌ Error loading occurrences for ${word.strongs}:`, error);
        setSelectedOccurrences([]);
        setCurrentStrongsId(null);
        setCursor(0);
      }
    } else {
      setSelectedOccurrences([]);
      setCurrentStrongsId(null);
      setCursor(0);
      setShowSearch(false);
    }
  };

  // Expert's Step 2: Clean cursor-based navigation
  const go = (delta: number) => {
    if (!occurrences.length) {
      console.log('❌ No occurrences available for navigation');
      return;
    }
    
    setCursor(c => {
      const next = (c + delta + occurrences.length) % occurrences.length;
      jumpToVerse(occurrences[next]);
      return next;
    });
  };

  // Expert's Step 3: Safe verse jumping
  const jumpToVerse = async (key: string) => {
    try {
      console.log(`🚀 EXPERT JUMP: Navigating to ${key}`);
      
      if (!onNavigateToVerse) {
        console.log('❌ onNavigateToVerse callback not available');
        return;
      }

      // Call the navigation callback directly with the verse reference
      onNavigateToVerse(key);
      console.log(`✅ EXPERT JUMP: Successfully navigated to ${key}`);
      
    } catch (error) {
      console.error('❌ EXPERT JUMP: Error navigating to verse:', error);
    }
  };

  // Legacy function for backward compatibility - now uses expert's method
  const navigateToAdjacentVerse = async (direction: 'up' | 'down') => {
    console.log(`🚀 EXPERT NAVIGATION: direction=${direction}`);
    
    // If we have occurrences from a selected Strong's word, use cursor navigation
    if (occurrences.length > 0 && currentStrongsId) {
      console.log(`📋 Using expert cursor navigation with ${occurrences.length} occurrences`);
      console.table(occurrences);
      const delta = direction === 'up' ? -1 : 1;
      go(delta);
      return;
    }
    
    // Fallback to verse-by-verse navigation if no Strong's word is selected
    if (!verse || !allVerses.length) {
      console.log(`❌ Navigation blocked: verse=${!!verse}, allVerses.length=${allVerses.length}`);
      return;
    }
    
    // Find current verse in allVerses array
    let currentIndex = -1;
    currentIndex = allVerses.findIndex((v: BibleVerse) => v.reference === verse.reference);
    
    if (currentIndex === -1) {
      currentIndex = allVerses.findIndex((v: BibleVerse) => v.id === verse.id);
    }
    
    if (currentIndex === -1) {
      currentIndex = allVerses.findIndex((v: BibleVerse) => 
        v.book === verse.book && 
        v.chapter === verse.chapter && 
        v.verse === verse.verse
      );
    }
    
    if (currentIndex === -1) {
      console.log(`❌ Current verse not found in allVerses array`);
      return;
    }
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < allVerses.length) {
      const newVerse = allVerses[newIndex];
      console.log(`🔍 Sequential navigation to: ${newVerse.reference}`);
      jumpToVerse(newVerse.reference);
    } else {
      console.log(`❌ Target index ${newIndex} is out of bounds`);
    }
  };

  // Expert's Step 5: Keyboard navigation (after function declarations)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        navigateToAdjacentVerse('up');
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        navigateToAdjacentVerse('down');
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col mx-2 md:mx-4"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`🔼 UP ARROW CLICKED - Expert navigation ${occurrences.length > 0 ? 'with occurrences' : 'sequential'}`);
                      navigateToAdjacentVerse('up');
                    }}
                    disabled={loading || (occurrences.length > 0 && occurrences.length < 2)}
                    className="w-8 h-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title={occurrences.length > 0 ? `Previous occurrence (${cursor + 1} of ${occurrences.length})` : "Previous verse"}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  
                  {/* Expert's Step 5: Show occurrence counter */}
                  {occurrences.length > 0 && currentStrongsId && (
                    <Badge variant="outline" className="text-xs px-2 py-1 font-mono">
                      {cursor + 1} of {occurrences.length}
                    </Badge>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`🔽 DOWN ARROW CLICKED - Expert navigation ${occurrences.length > 0 ? 'with occurrences' : 'sequential'}`);
                      navigateToAdjacentVerse('down');
                    }}
                    disabled={loading || (occurrences.length > 0 && occurrences.length < 2)}
                    className="w-8 h-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title={occurrences.length > 0 ? `Next occurrence (${cursor + 1} of ${occurrences.length})` : "Next verse"}
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
                <div className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 mb-4">
                  {verse.text?.KJV || verse.text?.[Object.keys(verse.text)[0]] || 'Loading verse text...'}
                </div>
                
                {/* Verse Context Info */}
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Book: {verse.book} | Chapter: {verse.chapter} | Verse: {verse.verse}</div>
                  {interlinearCells.length > 0 && (
                    <div>Original Language Words: {interlinearCells.length}</div>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Main Panel - Strong's Words Grid */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto">
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
                      <div className="strongs-word-grid">
                        {interlinearCells.map((cell, index) => (
                          <div
                            key={index}
                            className={`strongs-word-card group p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
                              selectedWord?.strongs === cell.strongsKey
                                ? 'selected border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 shadow-md'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                            onClick={async () => {
                              const word: StrongsWord = {
                                original: cell.original,
                                strongs: cell.strongsKey,
                                transliteration: cell.transliteration,
                                definition: cell.gloss || 'No definition available',
                                instances: []
                              };
                              await handleWordClick(word);
                            }}
                          >
                            {/* Word Index */}
                            <div className="absolute top-2 left-2 w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              {index + 1}
                            </div>

                            {/* Original Word with enhanced display */}
                            <div className="text-center mb-3">
                              <div className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2 leading-tight">
                                {cell.original || '—'}
                              </div>
                              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 italic font-medium mb-1">
                                {cell.transliteration || 'No transliteration'}
                              </div>
                              {/* Additional pronunciation if available */}
                              {(cell as any).pronunciation && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                  [{(cell as any).pronunciation}]
                                </div>
                              )}
                            </div>

                            {/* Strong's Number with enhanced info */}
                            <div className="text-center mb-3">
                              <Badge 
                                variant="outline" 
                                className={`font-mono text-xs px-2 py-1 mb-1 ${
                                  cell.strongsKey?.startsWith('H') 
                                    ? 'border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:bg-amber-900/20'
                                    : 'border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-900/20'
                                }`}
                              >
                                {cell.strongsKey} {cell.strongsKey?.startsWith('H') ? '🕎' : '🏛️'}
                              </Badge>
                              {/* Word frequency if available */}
                              {(cell as any).frequency && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Occurs {(cell as any).frequency}x
                                </div>
                              )}
                            </div>

                            {/* Enhanced Definition */}
                            <div className="text-xs md:text-sm text-gray-700 dark:text-gray-300 text-center mb-3 leading-relaxed min-h-[2.5rem] flex items-center justify-center">
                              <span className="line-clamp-3">
                                {cell.gloss || (cell as any).definition || 'No definition available'}
                              </span>
                            </div>

                            {/* Extended Definition Preview */}
                            {(cell as any).extendedDefinition && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 text-center mb-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="line-clamp-2">
                                  {(cell as any).extendedDefinition}
                                </span>
                              </div>
                            )}

                            {/* Part of Speech */}
                            {(cell as any).partOfSpeech && (
                              <div className="text-center mb-2">
                                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                  {(cell as any).partOfSpeech}
                                </Badge>
                              </div>
                            )}

                            {/* Morphology with enhanced display */}
                            {cell.morphology && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 text-center border-t pt-2 mt-auto">
                                <div className="font-semibold text-gray-600 dark:text-gray-300 mb-1">Grammar:</div>
                                <div className="truncate" title={cell.morphology}>
                                  {cell.morphology}
                                </div>
                              </div>
                            )}

                            {/* Root word info if available */}
                            {(cell as any).rootWord && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 text-center border-t pt-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="text-gray-600 dark:text-gray-300 font-medium">Root:</div>
                                <div className="truncate" title={(cell as any).rootWord}>
                                  {(cell as any).rootWord}
                                </div>
                              </div>
                            )}

                            {/* Additional metadata with enhanced info */}
                            <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div>{cell.strongsKey?.startsWith('H') ? 'Hebrew' : 'Greek'} • Word {index + 1}</div>
                              {(cell as any).lemma && (
                                <div className="mt-1">Lemma: {(cell as any).lemma}</div>
                              )}
                            </div>
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
                    <Separator orientation="vertical" className="hidden lg:block" />
                    <Separator orientation="horizontal" className="lg:hidden" />
                    <div className="w-full lg:w-96 flex flex-col max-h-[50vh] lg:max-h-full overflow-hidden">
                      <div className="p-4 border-b bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="font-mono">{selectedWord.strongs}</Badge>
                          <span className="font-semibold text-lg">{selectedWord.original}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-2">
                          {selectedWord.transliteration}
                        </p>
                        <p className="text-sm leading-relaxed">{selectedWord.definition}</p>
                      </div>

                      <div className="p-4 border-b flex-shrink-0">
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

                      <div className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
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
