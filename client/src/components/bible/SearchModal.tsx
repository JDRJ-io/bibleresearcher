import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Book, Filter, ArrowUp, ArrowDown, Settings, History, Clock, Zap, Target, Shuffle, Keyboard } from 'lucide-react';
import { useBibleStore } from '@/App';
import { LoadingWheel } from '@/components/LoadingWheel';
import { BibleSearchEngine, type SearchResult } from '@/lib/bibleSearchEngine';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  return isMobile;
};

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVerse: (verseReference: string) => void;
  verses?: any[]; // Array of verse objects with reference and text data
}

export function SearchModal({ isOpen, onClose, onNavigateToVerse, verses = [] }: SearchModalProps) {
  console.log('🔍 SearchModal rendered with:', {
    isOpen,
    versesLength: verses.length,
    firstVerse: verses[0]?.reference
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [displayedResults, setDisplayedResults] = useState(50);
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [searchAllTranslations, setSearchAllTranslations] = useState(false);
  
  // Advanced navigation state
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchMode, setSearchMode] = useState<'smart' | 'exact' | 'fuzzy'>('smart');
  const [selectedTranslations, setSelectedTranslations] = useState<string[]>(['KJV']);
  
  // Mobile responsiveness hook
  const isMobile = useIsMobile();
  
  const { mainTranslation: activeTranslation, getVerseText } = useTranslationMaps();
  
  // Create verse objects with text content for search engine
  const versesWithText = useMemo(() => {
    console.log(`🔍 SearchModal versesWithText memo - verses.length: ${verses.length}, getVerseText available: ${!!getVerseText}`);
    
    if (!verses.length || !getVerseText) {
      console.log(`🔍 SearchModal returning empty versesWithText`);
      return [];
    }
    
    const result = verses.map((verse, index) => {
      // Get text for all available translations using your working system
      const textObj: Record<string, string> = {};
      const translations = ['KJV', 'ESV', 'NIV', 'NLT', 'NASB', 'CSB', 'AMP', 'BSB', 'WEB', 'YLT', 'LSB', 'NKJV'];
      
      translations.forEach(translationCode => {
        const text = getVerseText(verse.reference, translationCode);
        if (text && text.trim()) {
          textObj[translationCode] = text.trim();
        }
      });
      
      return {
        id: verse.reference,
        reference: verse.reference, // Keep original format Gen.1:1 for proper search engine compatibility
        text: textObj,
        index
      };
    });
    
    console.log(`🔍 SearchModal created ${result.length} versesWithText, sample:`, result[0]);
    return result;
  }, [verses, getVerseText, activeTranslation]);
  
  // Create search engine instance
  const searchEngine = useMemo(() => {
    return new BibleSearchEngine(versesWithText);
  }, [versesWithText]);

  // Clear search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
      setSelectedResultIndex(-1);
      setShowHistory(false);
    }
  }, [isOpen]);

  // Auto-scroll to selected result
  useEffect(() => {
    if (selectedResultIndex >= 0) {
      const resultElement = document.querySelector(`[data-result-index="${selectedResultIndex}"]`);
      if (resultElement) {
        resultElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [selectedResultIndex]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    console.log(`🔍 Search Debug - Query: "${searchQuery}"`);
    console.log(`🔍 Search Debug - versesWithText.length: ${versesWithText.length}`);
    console.log(`🔍 Search Debug - activeTranslation: ${activeTranslation}`);
    console.log(`🔍 Search Debug - verses.length: ${verses.length}`);
    
    if (!versesWithText.length) {
      console.warn('Search: No verse data available yet. Loaded verses:', versesWithText.length);
      return;
    }
    
    // Check if versesWithText has proper text data
    const sampleVerse = versesWithText[0];
    console.log(`🔍 Search Debug - Sample verse:`, sampleVerse);
    
    setIsSearching(true);
    setHasSearched(true);
    setSelectedResultIndex(-1); // Reset selection
    
    try {
      // Add to search history
      if (searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
        setSearchHistory(prev => [searchQuery.trim(), ...prev.slice(0, 9)]); // Keep last 10 searches
      }
      
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`🔍 Advanced Search: "${searchQuery}" mode: ${searchMode}, translations: ${selectedTranslations.join(',')}`);
      
      let results: SearchResult[];
      
      // Enhanced search based on mode
      switch (searchMode) {
        case 'exact':
          results = searchEngine.search(`"${searchQuery}"`, activeTranslation, 10000, searchAllTranslations);
          break;
        case 'fuzzy':
          results = searchEngine.search(searchQuery, activeTranslation, 10000, true); // Enable fuzzy matching
          break;
        default: // 'smart'
          results = searchEngine.search(searchQuery, activeTranslation, 10000, searchAllTranslations);
      }
      
      console.log(`🔍 Search found ${results.length} results in ${searchMode} mode`);
      console.log(`🔍 Search raw results sample:`, results.slice(0, 3));
      
      // Filter to text-only results and sort by confidence
      const textResults = results
        .filter(r => r.type === 'text')
        .sort((a, b) => b.confidence - a.confidence);
      
      console.log(`🔍 Text-only results: ${textResults.length}`);
      console.log(`🔍 Text results sample:`, textResults.slice(0, 3));
      
      setAllResults(textResults);
      setSearchResults(textResults.slice(0, displayedResults));
      
      // Auto-select first result for keyboard navigation
      if (textResults.length > 0) {
        setSelectedResultIndex(0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedResultIndex >= 0 && searchResults.length > 0) {
        // Navigate to selected result
        handleResultClick(searchResults[selectedResultIndex]);
      } else {
        // Perform new search
        performSearch();
      }
      return;
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedResultIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
      }
      return;
    }
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedResultIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
      }
      return;
    }
    
    if (e.key === 'Escape') {
      if (selectedResultIndex >= 0) {
        setSelectedResultIndex(-1);
      } else {
        onClose();
      }
      return;
    }
    
    // Quick navigation shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'f':
          e.preventDefault();
          setShowAdvanced(!showAdvanced);
          break;
        case 'h':
          e.preventDefault();
          setShowHistory(!showHistory);
          break;
        case 'r':
          e.preventDefault();
          getRandomVerse();
          break;
      }
    }
  };

  const handleResultClick = (result: SearchResult) => {
    console.log(`🎯 Navigating to verse: ${result.verseId} from search result`);
    onNavigateToVerse(result.verseId);
    onClose();
  };

  const handleHistoryClick = (query: string) => {
    setSearchQuery(query);
    setShowHistory(false);
    // Auto-search when clicking history
    setTimeout(() => performSearch(), 100);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    setShowHistory(false);
  };

  const getRandomVerse = () => {
    console.log(`🎲 Random verse - verses.length: ${verses.length}`);
    if (verses.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * verses.length);
    const randomVerse = verses[randomIndex];
    const randomVerseKey = randomVerse.reference;
    console.log(`🎲 Selected random verse: ${randomVerseKey}`);
    onNavigateToVerse(randomVerseKey);
    onClose();
  };

  const getSearchTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'reference': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'text': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-h-[85vh] flex flex-col ${
          isMobile ? 'max-w-sm w-[95vw] mx-2' : 'max-w-4xl'
        }`}
        onInteractOutside={(e) => {
          // Allow clicking outside to close the modal
          onClose();
        }}
        onEscapeKeyDown={(e) => {
          // Enhanced escape key handling
          if (selectedResultIndex >= 0) {
            e.preventDefault();
            setSelectedResultIndex(-1);
          } else {
            onClose();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              {isMobile ? 'Search' : 'Intelligent Bible Search'}
            </div>
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                {showAdvanced ? 'Simple' : 'Advanced'}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder={isMobile ? "Search verses or references..." : "Try: 'John 3:16', 'love', 'Gen 1', 'Psalm 23:1-3', or any book/verse..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              autoFocus
            />
            <Button onClick={performSearch} disabled={isSearching}>
              {isSearching ? <LoadingWheel /> : <Search className="w-4 h-4" />}
            </Button>
            {!isMobile && (
              <>
                <Button 
                  variant="outline" 
                  onClick={getRandomVerse}
                  title="Random Verse (Ctrl+R)"
                >
                  <Book className="w-4 h-4" />
                </Button>
                <Button
                  variant={showHistory ? 'default' : 'outline'}
                  onClick={() => setShowHistory(!showHistory)}
                  title="Search History (Ctrl+H)"
                  disabled={searchHistory.length === 0}
                >
                  <History className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* Quick Actions Row - Hidden on Mobile */}
          {!isMobile && (
            <div className="flex flex-wrap gap-2">
              {/* Search Mode Selector */}
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={searchMode === 'smart' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSearchMode('smart')}
                  className="h-8 px-2 text-xs"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Smart
                </Button>
                <Button
                  variant={searchMode === 'exact' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSearchMode('exact')}
                  className="h-8 px-2 text-xs"
                >
                  <Target className="w-3 h-3 mr-1" />
                  Exact
                </Button>
                <Button
                  variant={searchMode === 'fuzzy' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSearchMode('fuzzy')}
                  className="h-8 px-2 text-xs"
                >
                  <Filter className="w-3 h-3 mr-1" />
                  Fuzzy
                </Button>
              </div>

              {/* Keyboard Shortcuts Help */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert(`Keyboard Shortcuts:
• Enter: Search or navigate to selected result
• ↑↓: Navigate through results
• Escape: Clear selection or close
• Ctrl+F: Toggle advanced options
• Ctrl+H: Toggle search history
• Ctrl+R: Random verse`)}
                className="h-8 px-2 text-xs"
              >
                <Keyboard className="w-3 h-3 mr-1" />
                Help
              </Button>

              {/* Results Info */}
              {hasSearched && (
                <div className="flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs">
                  <span className="font-medium">{searchResults.length}</span>
                  <span className="text-gray-500 ml-1">results</span>
                  {selectedResultIndex >= 0 && (
                    <span className="ml-2 text-blue-600 dark:text-blue-400">
                      [{selectedResultIndex + 1}/{searchResults.length}]
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mobile Results Info - Simple version */}
          {isMobile && hasSearched && (
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{searchResults.length} results found</span>
              {selectedResultIndex >= 0 && (
                <span className="text-blue-600 dark:text-blue-400">
                  {selectedResultIndex + 1}/{searchResults.length}
                </span>
              )}
            </div>
          )}

          {/* Search History */}
          {showHistory && searchHistory.length > 0 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Recent Searches</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearchHistory}
                  className="h-6 px-2 text-xs text-gray-500"
                >
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {searchHistory.map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleHistoryClick(query)}
                    className="h-7 px-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900"
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Primary Translation</label>
                  <div className="p-2 border rounded-md bg-gray-100 dark:bg-gray-600 text-sm">
                    {activeTranslation}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Results</label>
                  <div className="p-2 border rounded-md bg-gray-100 dark:bg-gray-600 text-sm">
                    Showing {searchResults.length} of {allResults.length} text matches
                  </div>
                </div>
              </div>
              
              {/* Multi-Translation Search Toggle */}
              <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <input
                  type="checkbox"
                  id="searchAllTranslations"
                  checked={searchAllTranslations}
                  onChange={(e) => setSearchAllTranslations(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="searchAllTranslations" className="text-sm font-medium">
                  Search across all translations
                </label>
                <div className="text-xs text-gray-500 ml-2">
                  (Find verses where specific translations use unique phrasing)
                </div>
              </div>
              
              {searchAllTranslations && (
                <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  <strong>Inter-translation search enabled:</strong> Results will show the same verse from different translations when they match your search terms differently. Perfect for finding unique translation-specific phrases.
                </div>
              )}
            </div>
          )}

          {/* Search Examples & Tips */}
          {!hasSearched && (
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              {!isMobile ? (
                // Desktop version - full examples
                <div>
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Search Examples:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong>Text Search:</strong>
                      <ul className="ml-4 space-y-1">
                        <li>• "love your enemies"</li>
                        <li>• "faith hope love"</li>
                        <li>• "in the beginning"</li>
                        <li>• "fear not"</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Reference Search:</strong>
                      <ul className="ml-4 space-y-1">
                        <li>• John 3:16</li>
                        <li>• Psalm 23</li>
                        <li>• Genesis 1:1-3</li>
                        <li>• Romans 8</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="font-medium mb-1 flex items-center gap-2">
                      <Keyboard className="w-4 h-4" />
                      Keyboard Shortcuts:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div>• <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">Enter</kbd> Search or navigate</div>
                      <div>• <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">↑↓</kbd> Browse results</div>
                      <div>• <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">Ctrl+H</kbd> Search history</div>
                      <div>• <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">Ctrl+R</kbd> Random verse</div>
                    </div>
                  </div>
                </div>
              ) : (
                // Mobile version - simplified examples
                <div className="text-center">
                  <p className="font-medium mb-2">Try searching for:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">John 3:16</span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">love</span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Psalm 23</span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">faith hope</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          <div className="flex-1 overflow-hidden">
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <LoadingWheel />
                <span className="ml-2">Searching...</span>
              </div>
            )}

            {hasSearched && !isSearching && searchResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No results found for "{searchQuery}"</p>
                <p className="text-sm">Try different keywords or check spelling</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>{searchResults.length} results found</span>
                  {!isMobile && showAdvanced && (
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">Ref</Badge>
                      <Badge variant="outline" className="text-xs">Text</Badge>
                      <Badge variant="outline" className="text-xs">Confidence</Badge>
                    </div>
                  )}
                </div>
                
                <div 
                  className="max-h-[400px] overflow-y-auto space-y-2"
                  onScroll={(e) => {
                    const element = e.target as HTMLDivElement;
                    const { scrollTop, scrollHeight, clientHeight } = element;
                    
                    // Load more results when near bottom
                    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
                      const nextBatch = displayedResults + 50;
                      if (nextBatch <= allResults.length) {
                        setDisplayedResults(nextBatch);
                        setSearchResults(allResults.slice(0, nextBatch));
                      }
                    }
                  }}
                >
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.verseId}-${index}`}
                      data-result-index={index}
                      onClick={() => handleResultClick(result)}
                      className={`${isMobile ? 'p-2' : 'p-3'} border rounded-lg cursor-pointer transition-all ${
                        selectedResultIndex === index
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md ring-2 ring-blue-200 dark:ring-blue-800'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${isMobile ? 'text-sm' : ''} ${
                            selectedResultIndex === index 
                              ? 'text-blue-700 dark:text-blue-300' 
                              : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {result.reference}
                          </span>
                          {!isMobile && selectedResultIndex === index && (
                            <Badge variant="default" className="text-xs bg-blue-600 text-white">
                              Selected
                            </Badge>
                          )}
                          {result.translationCode && searchAllTranslations && !isMobile && (
                            <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              {result.translationCode}
                            </Badge>
                          )}
                          {showAdvanced && !isMobile && (
                            <span className={`text-xs ${getConfidenceColor(result.confidence)}`}>
                              {Math.round(result.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        {selectedResultIndex === index && !isMobile && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Enter</kbd>
                          </div>
                        )}
                      </div>
                      <div 
                        className={`text-sm leading-relaxed ${
                          selectedResultIndex === index 
                            ? 'text-gray-900 dark:text-gray-100' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                        dangerouslySetInnerHTML={{ __html: result.highlightedText }}
                      />
                      {selectedResultIndex === index && !isMobile && (
                        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                          <span>Press Enter to navigate</span>
                          <span>•</span>
                          <span>Use ↑↓ arrows to browse</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}