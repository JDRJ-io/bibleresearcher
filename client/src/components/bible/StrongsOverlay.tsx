import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { fetchLemma, toLemmaKey, type LemmaPayload, type Occ } from '@/lib/searchIndex';
import { useLandscapeSidecar } from '@/hooks/useLandscapeSidecar';
import { useFocusScroller } from '@/hooks/useFocusScroller';

interface StrongsOverlayProps {
  verse: BibleVerse;
  onClose: () => void;
  allVerses: BibleVerse[];
  onNavigateToVerse?: (reference: string) => void;
  initialStrongsKey?: string;
}

interface WordOccurrence {
  reference: string;
  context: string;
  morphology?: string;
  snippet_html?: string;
}

interface SearchResults {
  lemmaData: LemmaPayload | null;
  loading: boolean;
  error: string | null;
}

interface NavigationHistoryEntry {
  reference: string;
  verseIndex: number;
  timestamp: number;
}

export function StrongsOverlay({ verse, onClose, allVerses, onNavigateToVerse, initialStrongsKey }: StrongsOverlayProps) {
  const [loading, setLoading] = useState(true);
  const [interlinearCells, setInterlinearCells] = useState<any[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<StrongsWord | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResults>({ lemmaData: null, loading: false, error: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryEntry[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  
  // Get main translation from hooks
  const { mainTranslation, getMainVerseText } = useTranslationMaps();
  const isLandscape = useLandscapeSidecar();
  
  // Auto-center focused inputs (callback refs for different scroll contexts)
  const mainScrollRef = useFocusScroller();  // For non-search mode
  const wordGridScrollRef = useFocusScroller();  // For search mode left pane  
  const searchResultsRef = useFocusScroller();  // For search mode right pane filter input
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
    setSearchResults({ lemmaData: null, loading: false, error: null });
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
    setSearchResults({ lemmaData: null, loading: true, error: null });

    try {
      // Use new search index system - much simpler and faster
      const lemmaKey = toLemmaKey(word.strongs, word.strongs.startsWith('H') ? 'Hebrew' : 'Greek');
      console.log(`🔍 Fetching lemma data for: ${lemmaKey}`);
      
      const lemmaData = await fetchLemma(lemmaKey);
      console.log(`✅ Loaded ${lemmaData.total} occurrences for ${lemmaKey}`);
      
      setSearchResults({ lemmaData, loading: false, error: null });
      
    } catch (error) {
      console.error('Error loading lemma data:', error);
      setSearchResults({ 
        lemmaData: null, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load search results'
      });
    }
  }, []);

  // Auto-select and search initial Strong's word if provided
  useEffect(() => {
    if (initialStrongsKey && interlinearCells.length > 0 && !loading) {
      const matchingCell = interlinearCells.find(cell => cell.strongsKey === initialStrongsKey);
      if (matchingCell) {
        console.log(`🎯 Auto-selecting Strong's word: ${initialStrongsKey}`);
        const word: StrongsWord = {
          original: matchingCell.original,
          strongs: matchingCell.strongsKey,
          transliteration: matchingCell.transliteration,
          definition: matchingCell.gloss || 'No definition available',
          instances: [],
          morphology: matchingCell.morphology,
          syntax: matchingCell.syntax,
          fullDefinition: matchingCell.fullDefinition
        };
        handleWordClick(word);
      }
    }
  }, [initialStrongsKey, interlinearCells, loading, handleWordClick]);

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
      setSearchResults({ lemmaData: null, loading: false, error: null });
    }
  }, [currentHistoryIndex, navigationHistory, onNavigateToVerse]);

  const canGoBack = currentHistoryIndex > 0;

  const goToPreviousVerse = useCallback(() => {
    if (currentVerseIndex > 0) {
      const newIndex = currentVerseIndex - 1;
      setCurrentVerseIndex(newIndex);
      setShowSearch(false);
      setSelectedWord(null);
      setSearchResults({ lemmaData: null, loading: false, error: null });
    }
  }, [currentVerseIndex]);

  const goToNextVerse = useCallback(() => {
    if (currentVerseIndex < allVerses.length - 1) {
      const newIndex = currentVerseIndex + 1;
      setCurrentVerseIndex(newIndex);
      setShowSearch(false);
      setSelectedWord(null);
      setSearchResults({ lemmaData: null, loading: false, error: null });
    }
  }, [currentVerseIndex, allVerses.length]);

  // Helper function to filter occurrences based on search query
  const filterOccurrences = (occurrences: Occ[]) => {
    if (!searchQuery) return occurrences;
    return occurrences.filter(occ =>
      occ.verse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (occ.snippet_html && occ.snippet_html.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-[calc(100vw-1rem)] sm:max-w-7xl h-[85vh] flex flex-col overflow-hidden"
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
              <div className={`bg-blue-50 dark:bg-blue-900/20 border-b ${isLandscape ? "p-2" : "p-3 md:p-4"}`}>
                <div className={`flex items-center justify-between ${isLandscape ? "mb-1" : "mb-2"}`}>
                  <Badge variant="outline" className={isLandscape ? "font-mono text-xs" : "font-mono text-sm"}>
                    {currentVerse.reference}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {interlinearCells.length} words
                  </span>
                </div>
                <div className={`leading-tight text-gray-800 dark:text-gray-200 line-clamp-2 ${isLandscape ? "text-xs" : "text-sm md:text-base"}`}>
                  {getMainVerseText(currentVerse.reference) || currentVerse.text?.[mainTranslation] || currentVerse.text?.[Object.keys(currentVerse.text)[0]] || 'Loading verse text...'}
                </div>
              </div>

              {/* Main content area - two-pane layout in landscape when search active - Independent scroll zones */}
              <div 
                ref={isLandscape && showSearch ? undefined : mainScrollRef}
                className={`flex-1 ${isLandscape && showSearch ? "flex" : ""} ${isLandscape && showSearch ? "overflow-hidden" : (isLandscape || !loading ? "overflow-y-auto" : "overflow-hidden")}`}
                style={!(isLandscape && showSearch) && (isLandscape || !loading) ? { paddingBottom: 'var(--kb)' } : undefined}
              >
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
                  <div 
                    ref={isLandscape && showSearch ? wordGridScrollRef : undefined}
                    className={`${isLandscape && showSearch ? "w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto" : ""} ${isLandscape && showSearch ? "p-2" : "p-3 md:p-4"}`}
                    style={isLandscape && showSearch ? { paddingBottom: 'var(--kb)' } : undefined}
                  >
                    <h3 className={`font-semibold ${isLandscape ? "text-sm mb-2" : "text-base md:text-lg mb-4"}`}>Select a word to analyze</h3>
                    {/* Box-style grid layout - 4x4 in landscape, 2x2 when search active in landscape */}
                    <div className={`grid ${isLandscape ? (showSearch ? "grid-cols-2 gap-2" : "grid-cols-4 gap-2") : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"}`}>
                      {interlinearCells.map((cell, index) => {
                        let pointerStartTime: number | null = null;
                        let pointerStartPos: { x: number; y: number } | null = null;
                        
                        return (
                          <div
                            key={index}
                            className={`${isLandscape ? "p-2" : "p-3"} border rounded-lg cursor-pointer transition-all ${
                              selectedWord?.strongs === cell.strongsKey
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                            }`}
                            onPointerDown={(e) => {
                              pointerStartTime = Date.now();
                              pointerStartPos = { x: e.clientX, y: e.clientY };
                            }}
                            onPointerUp={async (e) => {
                              if (!pointerStartTime || !pointerStartPos) return;
                              
                              const duration = Date.now() - pointerStartTime;
                              const deltaX = Math.abs(e.clientX - pointerStartPos.x);
                              const deltaY = Math.abs(e.clientY - pointerStartPos.y);
                              const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                              
                              // Only trigger if it's a short tap (less than 500ms) and minimal movement (less than 10px)
                              if (duration < 500 && distance < 10) {
                                const word: StrongsWord = {
                                  original: cell.original,
                                  strongs: cell.strongsKey,
                                  transliteration: cell.transliteration,
                                  definition: cell.gloss || 'No definition available',
                                  instances: [],
                                  morphology: cell.morphology, // Full grammatical analysis
                                  syntax: cell.syntax, // Syntax role: "modifier", "subject", etc.
                                  fullDefinition: cell.fullDefinition // Complete Strong's definition
                                };
                                await handleWordClick(word);
                              }
                              
                              pointerStartTime = null;
                              pointerStartPos = null;
                            }}
                            onPointerLeave={() => {
                              // Reset if pointer leaves the element
                              pointerStartTime = null;
                              pointerStartPos = null;
                            }}
                          >
                          <div className={`text-center ${isLandscape ? "space-y-0.5" : ""}`}>
                            <div className={`font-bold text-gray-800 dark:text-gray-200 ${isLandscape ? "text-base mb-0.5" : "text-lg mb-1"}`}>
                              {cell.original || '—'}
                            </div>
                            <div className={`text-gray-600 dark:text-gray-400 italic ${isLandscape ? "text-[11px] mb-0.5" : "text-xs mb-1"}`}>
                              {cell.transliteration}
                            </div>
                            <Badge variant="outline" className={`font-mono ${isLandscape ? "text-[10px] mb-1" : "text-xs mb-2"}`}>
                              {cell.strongsKey}
                            </Badge>
                            {/* Morphology - Full grammatical analysis */}
                            {cell.morphology && (
                              <div className={`text-gray-500 dark:text-gray-400 font-normal ${isLandscape ? "text-[10px] mb-0.5" : "text-xs mb-1"}`}>
                                {cell.morphology}
                              </div>
                            )}
                            {/* Syntax - Functional role */}
                            {cell.syntax && (
                              <div className={`text-blue-600 dark:text-blue-400 font-medium ${isLandscape ? "text-[10px] mb-0.5" : "text-xs mb-1"}`}>
                                Syntax: {cell.syntax}
                              </div>
                            )}
                            <div className={`text-gray-700 dark:text-gray-300 line-clamp-2 ${isLandscape ? "text-[11px]" : "text-xs"}`}>
                              {cell.gloss || 'No definition'}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No Strong's data available for this verse.</p>
                  </div>
                )}

                {/* Landscape side pane - search results - Single-Scroll Parent */}
                {isLandscape && showSearch && selectedWord && (
                  <aside ref={searchResultsRef} className="w-1/2 max-w-[50%] bg-white dark:bg-gray-900 flex flex-col border-l border-gray-200 dark:border-gray-700 overflow-y-auto" style={{ paddingBottom: 'var(--kb)' }}>
                    {/* Compact Header */}
                    <div className="p-2 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 flex-shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="font-mono text-xs">{selectedWord.strongs}</Badge>
                        <span className="text-sm font-semibold">{selectedWord.original}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 italic">
                          {selectedWord.transliteration}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowSearch(false)}
                          className="ml-auto"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        <span className="font-medium">{selectedWord.definition}</span>
                      </div>
                      {selectedWord.syntax && (
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                          Syntax: {selectedWord.syntax}
                        </div>
                      )}
                    </div>

                    {/* Compact Search section */}
                    <div className="p-2 border-b flex-shrink-0 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Search className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                            {searchResults.lemmaData?.total || 0} occurrences
                          </span>
                        </div>
                        {searchResults.loading && (
                          <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                        )}
                      </div>
                      <Input
                        placeholder="Filter verses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-xs h-7"
                      />
                    </div>

                    {/* Scrollable results */}
                    <div className="flex-1 min-h-0 p-2 space-y-4">
                      {searchResults.loading ? (
                        <div className="text-center py-4">
                          <div className="flex justify-center mb-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Loading...</p>
                        </div>
                      ) : searchResults.error ? (
                        <div className="text-center py-4">
                          <p className="text-xs text-red-500 dark:text-red-400">Error: {searchResults.error}</p>
                        </div>
                      ) : searchResults.lemmaData ? (
                        <>
                          {searchResults.lemmaData.group_morph_syntax.length > 0 && (
                            <section>
                              <h3 className="text-xs font-semibold mb-2 text-blue-800 dark:text-blue-200">Exact morph + syntax</h3>
                              <div className="space-y-2">
                                {searchResults.lemmaData.group_morph_syntax.map((group, idx) => {
                                  const filteredOccs = filterOccurrences(group.occurrences);
                                  if (filteredOccs.length === 0) return null;
                                  return (
                                    <div key={idx}>
                                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                        {group.morph} — {group.syntax} ({filteredOccs.length})
                                      </div>
                                      <div className="space-y-1.5">
                                        {filteredOccs.map((occ, i) => (
                                          <button
                                            key={i}
                                            onClick={() => goTo(occ.verse)}
                                            className="w-full text-left p-2 rounded border border-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:border-blue-500 transition-all text-xs"
                                          >
                                            <Badge variant="outline" className="font-mono text-[10px] mb-1">{occ.verse}</Badge>
                                            <div className="text-[11px] text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: occ.snippet_html || '' }} />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </section>
                          )}
                        </>
                      ) : null}
                    </div>
                  </aside>
                )}
              </div>

              {/* Bottom sheet search modal - portrait mode only */}
              <AnimatePresence>
                {!isLandscape && showSearch && selectedWord && (
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="absolute inset-x-0 bottom-0 bg-white dark:bg-gray-900 rounded-t-xl shadow-2xl border-t flex flex-col max-h-[calc(85vh-4rem)] min-h-0 z-10"
                    style={{ touchAction: 'pan-y' }}
                  >
                    {/* Handle bar */}
                    <div className="flex justify-center py-2 flex-shrink-0">
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
                      {/* Syntax information */}
                      {selectedWord.syntax && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Syntax: {selectedWord.syntax}
                        </div>
                      )}
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
                            {searchResults.lemmaData?.total || 0} occurrences
                          </span>
                        </div>
                        {searchResults.loading && (
                          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                            <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                            <span>Loading...</span>
                          </div>
                        )}
                      </div>
                      <Input
                        placeholder="Filter verses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-base h-10"
                      />
                    </div>

                    {/* Scrollable results - Native mobile scrolling */}
                    <div 
                      className="flex-1 min-h-0 overflow-y-auto overscroll-contain" 
                      style={{ 
                        WebkitOverflowScrolling: 'touch',
                        scrollBehavior: 'smooth',
                        paddingBottom: 'var(--kb)'
                      }}
                    >
                      <div className="p-3 space-y-6">
                        {searchResults.loading ? (
                          <div className="text-center py-8">
                            <div className="flex justify-center mb-3">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              Loading search results...
                            </p>
                          </div>
                        ) : searchResults.error ? (
                          <div className="text-center py-8">
                            <p className="text-sm text-red-500 dark:text-red-400">
                              Error: {searchResults.error}
                            </p>
                          </div>
                        ) : searchResults.lemmaData ? (
                          <>
                            {/* 1) Exact Morph + Syntax */}
                            {searchResults.lemmaData.group_morph_syntax.length > 0 && (
                              <section>
                                <h3 className="font-semibold mb-3 text-blue-800 dark:text-blue-200">Exact morph + syntax</h3>
                                <div className="space-y-3">
                                  {searchResults.lemmaData.group_morph_syntax.map((group, idx) => {
                                    const filteredOccs = filterOccurrences(group.occurrences);
                                    if (filteredOccs.length === 0) return null;
                                    
                                    return (
                                      <div key={idx}>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                          {group.morph} — {group.syntax} ({filteredOccs.length})
                                        </div>
                                        <div className="space-y-2">
                                          {filteredOccs.map((occ, i) => (
                                            <button
                                              key={i}
                                              onClick={() => goTo(occ.verse)}
                                              className="w-full text-left p-3 rounded-lg border border-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:border-blue-500 transition-all duration-200 group"
                                            >
                                              <div className="flex items-center justify-between mb-2">
                                                <Badge variant="outline" className="font-mono text-sm">
                                                  {occ.verse}
                                                </Badge>
                                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                              </div>
                                              <div 
                                                className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: occ.snippet_html || '' }}
                                              />
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </section>
                            )}

                            {/* 2) Morph only */}
                            {searchResults.lemmaData.group_morph.length > 0 && (
                              <section>
                                <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Same morph</h3>
                                <div className="space-y-3">
                                  {searchResults.lemmaData.group_morph.map((group, idx) => {
                                    const filteredOccs = filterOccurrences(group.occurrences);
                                    if (filteredOccs.length === 0) return null;
                                    
                                    return (
                                      <div key={idx}>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                          {group.morph} ({filteredOccs.length})
                                        </div>
                                        <div className="space-y-2">
                                          {filteredOccs.map((occ, i) => (
                                            <button
                                              key={i}
                                              onClick={() => goTo(occ.verse)}
                                              className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
                                            >
                                              <div className="flex items-center justify-between mb-2">
                                                <Badge variant="outline" className="font-mono text-sm">
                                                  {occ.verse}
                                                </Badge>
                                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                              </div>
                                              <div 
                                                className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: occ.snippet_html || '' }}
                                              />
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </section>
                            )}

                            {/* 3) All canonical */}
                            {searchResults.lemmaData.all_canonical.length > 0 && (
                              <section>
                                <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">All canonical</h3>
                                <div className="space-y-2">
                                  {filterOccurrences(searchResults.lemmaData.all_canonical).map((occ, i) => (
                                    <button
                                      key={i}
                                      onClick={() => goTo(occ.verse)}
                                      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-gray-50/50 dark:bg-gray-800/30 transition-all duration-200 group"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="font-mono text-sm">
                                          {occ.verse}
                                        </Badge>
                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                      </div>
                                      <div 
                                        className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: occ.snippet_html || '' }}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </section>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              No search results available
                            </p>
                          </div>
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