import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BibleDataAPI } from '@/data/BibleDataAPI';
import { BibleVerse, StrongsWord } from '@/types/bible';
import { useVerseNav } from '@/hooks/useVerseNav';

interface StrongsOverlayProps {
  verse: BibleVerse;
  onClose: () => void;
  allVerses: BibleVerse[];
}

interface WordOccurrence {
  reference: string;
  context: string;
}

export function StrongsOverlay({ verse, onClose, allVerses }: StrongsOverlayProps) {
  const [loading, setLoading] = useState(true);
  const [interlinearCells, setInterlinearCells] = useState<any[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<StrongsWord | null>(null);
  const [selectedOccurrences, setSelectedOccurrences] = useState<WordOccurrence[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  // Simple navigation function without the full useVerseNav hook
  const goTo = (reference: string) => {
    // Close the overlay and let the parent handle navigation
    onClose();
    // You can add navigation logic here or let the parent component handle it
    window.location.hash = reference;
  };

  // Find current verse in the array
  useEffect(() => {
    if (allVerses && verse) {
      const index = allVerses.findIndex(v => v.reference === verse.reference);
      if (index !== -1) {
        setCurrentVerseIndex(index);
      }
    }
  }, [verse, allVerses]);

  // Get current verse data
  const currentVerse = allVerses[currentVerseIndex] || verse;

  // Load Strong's data for current verse - FIXED: Now updates when verse changes
  useEffect(() => {
    const loadStrongsData = async () => {
      if (!currentVerse?.reference) return;
      
      setLoading(true);
      setShowSearch(false); // Close search when switching verses
      setSelectedWord(null); // Clear selected word
      try {
        const cells = await BibleDataAPI.getInterlinearData(currentVerse.reference);
        setInterlinearCells(cells || []);
      } catch (error) {
        console.error('Error loading Strong\'s data:', error);
        setInterlinearCells([]);
      } finally {
        setLoading(false);
      }
    };

    loadStrongsData();
  }, [currentVerse?.reference]);

  const handleWordClick = useCallback(async (word: StrongsWord) => {
    setSelectedWord(word);
    setShowSearch(true);
    setSearchQuery('');

    try {
      // Get word occurrences from API
      const occurrences = await BibleDataAPI.getStrongsOccurrences(word.strongs);
      setSelectedOccurrences(occurrences || []);
    } catch (error) {
      console.error('Error loading word occurrences:', error);
      setSelectedOccurrences([]);
    }
  }, []);

  const goToPreviousVerse = useCallback(() => {
    if (currentVerseIndex > 0) {
      const newIndex = currentVerseIndex - 1;
      setCurrentVerseIndex(newIndex);
      setShowSearch(false);
      setSelectedWord(null);
    }
  }, [currentVerseIndex]);

  const goToNextVerse = useCallback(() => {
    if (currentVerseIndex < allVerses.length - 1) {
      const newIndex = currentVerseIndex + 1;
      setCurrentVerseIndex(newIndex);
      setShowSearch(false);
      setSelectedWord(null);
    }
  }, [currentVerseIndex, allVerses.length]);

  // Filter occurrences based on search
  const filteredOccurrences = selectedOccurrences.filter(occurrence =>
    occurrence.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    occurrence.context.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">Strong's Analysis</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousVerse}
                disabled={currentVerseIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextVerse}
                disabled={currentVerseIndex >= allVerses.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {currentVerse && (
            <>
              {/* Condensed verse header */}
              <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 border-b">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="font-mono text-sm">
                    {currentVerse.reference}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {interlinearCells.length} words
                  </span>
                </div>
                <div className="text-sm md:text-base leading-tight text-gray-800 dark:text-gray-200 line-clamp-2">
                  {currentVerse.text?.KJV || currentVerse.text?.[Object.keys(currentVerse.text)[0]] || 'Loading verse text...'}
                </div>
              </div>

              {/* Mobile-first layout */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Main content area */}
                <div className="flex-1 p-3 md:p-4 overflow-y-auto">
                  {showSearch ? (
                    /* Mobile search results - full screen */
                    <div className="lg:hidden h-full">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="font-mono">{selectedWord?.strongs}</Badge>
                          <span className="font-semibold text-lg">{selectedWord?.original}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowSearch(false)}
                            className="ml-auto"
                          >
                            ← Back
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Found {selectedOccurrences.length} occurrences
                          </span>
                        </div>
                        <Input
                          placeholder="Filter verses..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="text-sm h-10 mb-3"
                        />
                      </div>
                      
                      {/* Scrollable search results */}
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {filteredOccurrences.length > 0 ? (
                          filteredOccurrences.map((occurrence, index) => (
                            <button
                              key={`${occurrence.reference}-${index}`}
                              onClick={() => goTo(occurrence.reference)}
                              className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="font-mono text-sm">
                                  {occurrence.reference}
                                </Badge>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {occurrence.context}
                              </p>
                            </button>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-8">
                            {searchQuery ? `No occurrences match "${searchQuery}"` : 'Loading occurrences...'}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Word selection interface */
                    loading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Loading...</p>
                        </div>
                      </div>
                    ) : interlinearCells.length > 0 ? (
                      <div>
                        <h3 className="text-base md:text-lg font-semibold mb-4">Select a word to analyze</h3>
                        {/* Box-style grid layout instead of horizontal scrolling */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {interlinearCells.map((cell, index) => (
                            <div
                              key={index}
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                selectedWord?.strongs === cell.strongsKey
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
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
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">
                                  {cell.original || '—'}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 italic mb-1">
                                  {cell.transliteration}
                                </div>
                                <Badge variant="outline" className="text-xs font-mono mb-2">
                                  {cell.strongsKey}
                                </Badge>
                                <div className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                                  {cell.gloss || 'No definition'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No Strong's data available for this verse.</p>
                      </div>
                    )
                  )}
                </div>

                {/* Desktop sidebar for search results */}
                {showSearch && selectedWord && (
                  <>
                    <Separator orientation="vertical" className="hidden lg:block" />
                    <div className="hidden lg:block w-96 flex flex-col max-h-full overflow-hidden">
                      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 flex-shrink-0">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="font-mono">{selectedWord.strongs}</Badge>
                          <span className="font-semibold text-lg">{selectedWord.original}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-2">
                          {selectedWord.transliteration}
                        </p>
                        <p className="text-sm leading-relaxed">{selectedWord.definition}</p>
                      </div>

                      <div className="p-4 border-b flex-shrink-0 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Found {selectedOccurrences.length} occurrences
                          </span>
                        </div>
                        <Input
                          placeholder="Filter verses..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="text-sm h-10"
                        />
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                          <div className="p-4 space-y-3">
                            {filteredOccurrences.length > 0 ? (
                              filteredOccurrences.map((occurrence, index) => (
                                <button
                                  key={`${occurrence.reference}-${index}`}
                                  onClick={() => goTo(occurrence.reference)}
                                  className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                                      {occurrence.reference}
                                    </Badge>
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                                    {occurrence.context}
                                  </p>
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