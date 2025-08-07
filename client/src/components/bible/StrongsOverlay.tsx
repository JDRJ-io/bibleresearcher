import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import { Separator } from '@/components/ui/separator';
import { BibleDataAPI } from '@/data/BibleDataAPI';
import { BibleVerse, StrongsWord } from '@/types/bible';
import { useVerseNav } from '@/hooks/useVerseNav';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { HolyBookLoader } from '@/components/ui/HolyBookLoader';

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
  
  // Get main translation from hooks
  const { mainTranslation, getMainVerseText } = useTranslationMaps();
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
      console.log(`🔍 Loading occurrences for ${word.strongs} with morphology: ${word.morphology}`);
      
      // Get word occurrences from API
      const rawOccurrences = await BibleDataAPI.getStrongsOccurrences(word.strongs);
      
      if (!rawOccurrences || rawOccurrences.length === 0) {
        setSelectedOccurrences([]);
        return;
      }

      // Enhance occurrences with morphology data and sort by morphology match
      const enhancedOccurrences = [];
      const clickedMorphology = word.morphology || '';
      
      // Process occurrences in batches to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < rawOccurrences.length; i += batchSize) {
        const batch = rawOccurrences.slice(i, i + batchSize);
        const batchPromises = batch.map(async (occurrence) => {
          try {
            // Get verse data to extract morphology for this specific Strong's number
            const verseData = await BibleDataAPI.getInterlinearData(occurrence.reference);
            
            // Find the matching Strong's word in this verse
            const matchingWord = verseData?.find(cell => 
              cell.strongsKey === word.strongs && cell.original === occurrence.original
            );
            
            return {
              ...occurrence,
              morphology: matchingWord?.morphology || ''
            };
          } catch (error) {
            console.warn(`Failed to get morphology for ${occurrence.reference}:`, error);
            return { ...occurrence, morphology: '' };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        enhancedOccurrences.push(...batchResults);
      }
      
      // Sort by morphology match: exact matches first, then others
      const sortedOccurrences = enhancedOccurrences.sort((a, b) => {
        const aExactMatch = a.morphology === clickedMorphology;
        const bExactMatch = b.morphology === clickedMorphology;
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // For non-exact matches, sort alphabetically by reference
        return a.reference.localeCompare(b.reference);
      });
      
      console.log(`✅ Sorted ${sortedOccurrences.length} occurrences by morphology match`);
      setSelectedOccurrences(sortedOccurrences);
      
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
                  {getMainVerseText(currentVerse.reference) || currentVerse.text?.[mainTranslation] || currentVerse.text?.[Object.keys(currentVerse.text)[0]] || 'Loading verse text...'}
                </div>
              </div>

              {/* Main content area - unified mobile/desktop */}
              <div className="flex-1 p-3 md:p-4 overflow-y-auto">
                {/* Word selection interface */}
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="flex justify-center mb-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Loading...</p>
                    </div>
                  </div>
                ) : interlinearCells.length > 0 ? (
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-4">Select a word to analyze</h3>
                    {/* Box-style grid layout */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
                              instances: [],
                              morphology: cell.morphology, // Full grammatical analysis
                              fullDefinition: cell.fullDefinition // Complete Strong's definition
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
                            {/* Morphology - Full grammatical analysis */}
                            {cell.morphology && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 font-normal mb-1">
                                {cell.morphology}
                              </div>
                            )}
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
                )}
              </div>

              {/* Bottom sheet search modal - unified for mobile and desktop */}
              <AnimatePresence>
                {showSearch && selectedWord && (
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="absolute inset-x-0 bottom-0 bg-white dark:bg-gray-900 rounded-t-xl shadow-2xl border-t flex flex-col max-h-[70vh] z-10"
                    style={{ touchAction: 'pan-y' }}
                  >
                    {/* Handle bar */}
                    <div className="flex justify-center py-2">
                      <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    </div>

                    {/* Header */}
                    <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 flex-shrink-0">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="font-mono">{selectedWord.strongs}</Badge>
                        <span className="font-semibold text-lg">{selectedWord.original}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowSearch(false)}
                          className="ml-auto"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-2">
                        {selectedWord.transliteration}
                      </p>
                      {/* Full Morphology - Grammatical Analysis */}
                      {selectedWord.morphology && (
                        <div className="mb-2">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Morphology:</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {selectedWord.morphology}
                          </p>
                        </div>
                      )}
                      {/* Short Definition */}
                      <div className="mb-2">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Gloss:</div>
                        <p className="text-sm">{selectedWord.definition}</p>
                      </div>
                      {/* Full Strong's Definition */}
                      {selectedWord.fullDefinition && selectedWord.fullDefinition !== selectedWord.definition && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Complete Definition:</div>
                          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                            {selectedWord.fullDefinition}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Search section */}
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

                    {/* Scrollable results - Native mobile scrolling */}
                    <div 
                      className="flex-1 overflow-y-auto overscroll-contain" 
                      style={{ 
                        WebkitOverflowScrolling: 'touch',
                        scrollBehavior: 'smooth'
                      }}
                    >
                      <div className="p-4 space-y-3">
                        {filteredOccurrences.length > 0 ? (
                          filteredOccurrences.map((occurrence, index) => {
                            const isExactMorphologyMatch = occurrence.morphology === selectedWord.morphology;
                            return (
                              <button
                                key={`${occurrence.reference}-${index}`}
                                onClick={() => goTo(occurrence.reference)}
                                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group ${
                                  isExactMorphologyMatch
                                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:border-blue-500'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                                      {occurrence.reference}
                                    </Badge>
                                    {isExactMorphologyMatch && (
                                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-1">
                                        Exact Match
                                      </Badge>
                                    )}
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                </div>
                                {/* Show morphology if available */}
                                {occurrence.morphology && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono">
                                    {occurrence.morphology}
                                  </div>
                                )}
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                                  {occurrence.context}
                                </p>
                              </button>
                            );
                          })
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}