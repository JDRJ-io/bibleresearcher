import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Search, ArrowLeft } from 'lucide-react';
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
  onNavigateToVerse?: (reference: string) => void;
}

interface WordOccurrence {
  reference: string;
  context: string;
  morphology?: string;
}

interface NavigationHistoryEntry {
  reference: string;
  verseIndex: number;
  timestamp: number;
}

export function StrongsOverlay({ verse, onClose, allVerses, onNavigateToVerse }: StrongsOverlayProps) {
  const [loading, setLoading] = useState(true);
  const [interlinearCells, setInterlinearCells] = useState<any[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<StrongsWord | null>(null);
  const [selectedOccurrences, setSelectedOccurrences] = useState<WordOccurrence[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [morphologyLoading, setMorphologyLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryEntry[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  
  // Get main translation from hooks
  const { mainTranslation, getMainVerseText } = useTranslationMaps();
  // Enhanced navigation function with history tracking
  const goTo = useCallback((reference: string) => {
    console.log(`🔍 Strong's navigating to: ${reference}`);
    
    // Find target verse in allVerses
    const targetVerseIndex = allVerses.findIndex(v => 
      v.reference === reference || 
      v.reference === reference.replace(/\s+/g, '.') ||
      (v.reference.toLowerCase() === reference.toLowerCase())
    );
    
    if (targetVerseIndex === -1) {
      console.warn(`❌ Could not find verse ${reference} in allVerses`);
      return;
    }
    
    const targetVerse = allVerses[targetVerseIndex];
    
    // Add current position to navigation history before navigating
    const currentEntry: NavigationHistoryEntry = {
      reference: allVerses[currentVerseIndex]?.reference || '',
      verseIndex: currentVerseIndex,
      timestamp: Date.now()
    };
    
    setNavigationHistory(prev => {
      const newHistory = [...prev];
      // If we're in the middle of history, truncate future entries
      if (currentHistoryIndex >= 0 && currentHistoryIndex < newHistory.length - 1) {
        newHistory.splice(currentHistoryIndex + 1);
      }
      newHistory.push(currentEntry);
      return newHistory;
    });
    
    setCurrentHistoryIndex(prev => prev + 1);
    
    // Navigate to the new verse in the background (center it in main Bible)
    if (onNavigateToVerse) {
      onNavigateToVerse(reference);
    }
    
    // Update the overlay to show the new verse (keep overlay open)
    setCurrentVerseIndex(targetVerseIndex);
    setShowSearch(false);
    setSelectedWord(null);
    setMorphologyLoading(false);
    setLoadingProgress(0);
  }, [allVerses, currentVerseIndex, onNavigateToVerse, currentHistoryIndex]);

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
    setMorphologyLoading(true);
    setLoadingProgress(0);

    try {
      // Step 1: Get basic occurrences quickly and show them immediately
      const rawOccurrences = await BibleDataAPI.getStrongsOccurrences(word.strongs);
      
      if (!rawOccurrences || rawOccurrences.length === 0) {
        setSelectedOccurrences([]);
        setMorphologyLoading(false);
        return;
      }

      // Step 2: Show basic results immediately (without morphology)
      const basicOccurrences: WordOccurrence[] = rawOccurrences.map(occ => ({
        reference: occ.reference,
        context: occ.context
      }));
      
      setSelectedOccurrences(basicOccurrences);

      // Step 3: Enhance with morphology data progressively (without reordering until complete)
      const clickedMorphology = word.morphology || '';
      const workingResults = [...basicOccurrences]; // Create working copy to update in-place
      
      // Smaller batch size for smoother progress updates
      const batchSize = 5;
      const totalBatches = Math.ceil(rawOccurrences.length / batchSize);
      let processedCount = 0;
      
      for (let i = 0; i < rawOccurrences.length; i += batchSize) {
        const batch = rawOccurrences.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (occurrence, index) => {
          try {
            // Add small delay between requests to avoid overwhelming
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            const verseData = await BibleDataAPI.getInterlinearData(occurrence.reference);
            
            const matchingWord = verseData?.find(cell => 
              cell.strongsKey === word.strongs && cell.original === occurrence.original
            );
            
            return {
              reference: occurrence.reference,
              context: occurrence.context,
              morphology: matchingWord?.morphology || ''
            };
          } catch (error) {
            return {
              reference: occurrence.reference,
              context: occurrence.context,
              morphology: ''
            };
          }
        });
        
        try {
          const batchResults = await Promise.all(batchPromises);
          
          // Update items in-place without reordering
          batchResults.forEach((result, index) => {
            const globalIndex = i + index;
            if (globalIndex < workingResults.length) {
              workingResults[globalIndex] = result;
            }
          });
          
          processedCount += batchResults.length;
          
          // Update progress
          const currentBatch = Math.floor(i / batchSize) + 1;
          setLoadingProgress(Math.round((currentBatch / totalBatches) * 100));
          
          // Update display with enhanced items in original positions (no reordering yet)
          setSelectedOccurrences([...workingResults]);
          
        } catch (batchError) {
          // If entire batch fails, continue with next batch
          processedCount += batch.length;
          continue;
        }
      }
      
      // Final step: Sort everything once at the end
      const finalSorted = workingResults.sort((a, b) => {
        const aExactMatch = a.morphology === clickedMorphology && a.morphology;
        const bExactMatch = b.morphology === clickedMorphology && b.morphology;
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // Secondary sort: verses with morphology come before those without
        const aHasMorphology = Boolean(a.morphology);
        const bHasMorphology = Boolean(b.morphology);
        
        if (aHasMorphology && !bHasMorphology) return -1;
        if (!aHasMorphology && bHasMorphology) return 1;
        
        return a.reference.localeCompare(b.reference);
      });
      
      setSelectedOccurrences(finalSorted);
      setMorphologyLoading(false);
      
    } catch (error) {
      console.error('Error loading word occurrences:', error);
      setSelectedOccurrences([]);
      setMorphologyLoading(false);
    }
  }, []);

  // Navigation history back function
  const goBack = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const targetIndex = currentHistoryIndex - 1;
      const historyEntry = navigationHistory[targetIndex];
      
      console.log(`🔙 Going back in Strong's history to: ${historyEntry.reference}`);
      
      // Navigate to the verse in the background
      if (onNavigateToVerse) {
        onNavigateToVerse(historyEntry.reference);
      }
      
      // Update overlay to show the historical verse
      setCurrentVerseIndex(historyEntry.verseIndex);
      setCurrentHistoryIndex(targetIndex);
      setShowSearch(false);
      setSelectedWord(null);
      setMorphologyLoading(false);
      setLoadingProgress(0);
    }
  }, [currentHistoryIndex, navigationHistory, onNavigateToVerse]);

  const canGoBack = currentHistoryIndex > 0;

  const goToPreviousVerse = useCallback(() => {
    if (currentVerseIndex > 0) {
      const newIndex = currentVerseIndex - 1;
      setCurrentVerseIndex(newIndex);
      setShowSearch(false);
      setSelectedWord(null);
      setMorphologyLoading(false);
      setLoadingProgress(0);
    }
  }, [currentVerseIndex]);

  const goToNextVerse = useCallback(() => {
    if (currentVerseIndex < allVerses.length - 1) {
      const newIndex = currentVerseIndex + 1;
      setCurrentVerseIndex(newIndex);
      setShowSearch(false);
      setSelectedWord(null);
      setMorphologyLoading(false);
      setLoadingProgress(0);
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
              {/* Back button for navigation history */}
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                disabled={!canGoBack}
                title="Go back to previous verse"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousVerse}
                disabled={currentVerseIndex === 0}
                title="Previous verse in sequence"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextVerse}
                disabled={currentVerseIndex >= allVerses.length - 1}
                title="Next verse in sequence"
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
                    className="absolute inset-x-0 bottom-0 bg-white dark:bg-gray-900 rounded-t-xl shadow-2xl border-t flex flex-col max-h-[85vh] z-10"
                    style={{ touchAction: 'pan-y' }}
                  >
                    {/* Handle bar */}
                    <div className="flex justify-center py-2">
                      <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    </div>

                    {/* Compact Header */}
                    <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 flex-shrink-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="font-mono text-xs">{selectedWord.strongs}</Badge>
                        <span className="font-semibold">{selectedWord.original}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 italic">
                          {selectedWord.transliteration}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowSearch(false)}
                          className="ml-auto"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      {/* Compact definition on single line */}
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        <span className="font-medium">{selectedWord.definition}</span>
                        {selectedWord.morphology && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({selectedWord.morphology})</span>
                        )}
                      </div>
                      {/* Show full definition only if significantly different */}
                      {selectedWord.fullDefinition && selectedWord.fullDefinition !== selectedWord.definition && selectedWord.fullDefinition.length > selectedWord.definition.length + 10 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {selectedWord.fullDefinition}
                        </div>
                      )}
                    </div>

                    {/* Compact Search section */}
                    <div className="p-3 border-b flex-shrink-0 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            {selectedOccurrences.length} occurrences
                          </span>
                        </div>
                        {morphologyLoading && (
                          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                            <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                            <span>{loadingProgress}%</span>
                          </div>
                        )}
                      </div>
                      <Input
                        placeholder="Filter verses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-sm h-8"
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
                      <div className="p-3 space-y-2">
                        {filteredOccurrences.length > 0 ? (
                          filteredOccurrences.map((occurrence, index) => {
                            const isExactMorphologyMatch = occurrence.morphology === selectedWord.morphology && occurrence.morphology;
                            const hasMorphology = Boolean(occurrence.morphology);
                            
                            return (
                              <button
                                key={`${occurrence.reference}-${index}`}
                                onClick={() => goTo(occurrence.reference)}
                                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group relative ${
                                  isExactMorphologyMatch
                                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:border-blue-500'
                                    : hasMorphology
                                    ? 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-gray-50/50 dark:bg-gray-800/30'
                                }`}
                              >
                                {/* Show loading indicator for entries without morphology */}
                                {!hasMorphology && morphologyLoading && (
                                  <div className="absolute top-2 right-2">
                                    <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent opacity-50"></div>
                                  </div>
                                )}
                                
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
                        ) : selectedOccurrences.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="flex justify-center mb-3">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              Loading occurrences...
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-8">
                            No occurrences found
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