import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, X, Filter, ArrowUp, ArrowDown, Settings, History, Clock, Zap, Target, Shuffle, Keyboard, Navigation } from 'lucide-react';
import { useBibleStore } from '@/App';
import { LoadingWheel } from '@/components/LoadingWheel';
import { BibleSearchEngine, type SearchResult } from '@/lib/bibleSearchEngine';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { ScrollWheelSelector } from './ScrollWheelSelector';

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
  onSwitchTranslation?: (translationCode: string) => void;
  verses?: any[]; // Array of verse objects with reference and text data
}

export function SearchModal({ isOpen, onClose, onNavigateToVerse, onSwitchTranslation, verses = [] }: SearchModalProps) {
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
  // Removed searchAllTranslations toggle - now using individual translation selection
  
  // Advanced navigation state
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [selectedTranslations, setSelectedTranslations] = useState<string[]>(['KJV']);
  
  // Mobile responsiveness hook
  const isMobile = useIsMobile();
  
  const { mainTranslation: activeTranslation, getVerseText } = useTranslationMaps();
  
  // State for loaded translations cache
  const [loadedTranslations, setLoadedTranslations] = useState<Map<string, Map<string, string>>>(new Map());

  // Load additional translations for search
  const loadTranslationForSearch = async (translationCode: string): Promise<Map<string, string> | null> => {
    if (loadedTranslations.has(translationCode)) {
      return loadedTranslations.get(translationCode)!;
    }

    try {
      console.log(`🔍 Loading translation for search: ${translationCode}`);
      const { loadTranslation } = await import('@/data/BibleDataAPI');
      const translationMap = await loadTranslation(translationCode);
      
      if (translationMap && translationMap.size > 0) {
        setLoadedTranslations(prev => new Map(prev).set(translationCode, translationMap));
        console.log(`🔍 Successfully loaded ${translationCode} with ${translationMap.size} verses`);
        return translationMap;
      }
    } catch (error) {
      console.error(`🔍 Failed to load translation ${translationCode}:`, error);
    }
    
    return null;
  };

  // Create verse objects with text content for search engine
  const versesWithText = useMemo(() => {
    console.log(`🔍 SearchModal versesWithText memo - verses.length: ${verses.length}, getVerseText available: ${!!getVerseText}`);
    
    if (!verses.length || !getVerseText) {
      console.log(`🔍 SearchModal returning empty versesWithText`);
      return [];
    }
    
    const result = verses.map((verse, index) => {
      // Get text for currently loaded translations using your working system
      const textObj: Record<string, string> = {};
      const currentlyLoadedTranslations = ['AMP', 'BSB', 'CSB', 'ESV', 'KJV', 'LSB', 'NASB', 'NIV', 'NKJV', 'NLT', 'NRSV', 'WEB', 'YLT'];
      
      currentlyLoadedTranslations.forEach(translationCode => {
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
    console.log(`🔍 SearchModal sample verse text object:`, result[0]?.text);
    console.log(`🔍 SearchModal sample verse keys in text:`, Object.keys(result[0]?.text || {}));
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
    
    console.log(`🔍 REAL SEARCH START - Query: "${searchQuery}"`);
    console.log(`🔍 REAL SEARCH - verses available: ${verses.length}`);
    console.log(`🔍 REAL SEARCH - activeTranslation: ${activeTranslation}`);
    
    if (!verses.length) {
      console.error('🔍 REAL SEARCH ABORT - No verses loaded');
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    setSelectedResultIndex(-1); // Reset selection
    
    try {
      // Add to search history
      if (searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
        setSearchHistory(prev => [searchQuery.trim(), ...prev.slice(0, 9)]); // Keep last 10 searches
      }
      
      console.log(`🔍 REAL SEARCH EXECUTE - Search term: "${searchQuery}"`);
      
      // Determine which translations to search - use selected translations or fallback to active translation
      const translationsToSearch = selectedTranslations.length > 0 ? 
        selectedTranslations : 
        [activeTranslation];
      
      console.log(`🔍 REAL SEARCH - Searching ${translationsToSearch.length} translations: ${translationsToSearch.join(', ')}`);
      
      // Load any translations that aren't already loaded
      const translationMaps = new Map<string, Map<string, string>>();
      
      for (const translationCode of translationsToSearch) {
        // First try to get from current system
        let translationMap = loadedTranslations.get(translationCode);
        
        if (!translationMap) {
          // Load the translation dynamically
          console.log(`🔍 Loading additional translation: ${translationCode}`);
          translationMap = await loadTranslationForSearch(translationCode) || undefined;
        }
        
        if (translationMap) {
          translationMaps.set(translationCode, translationMap);
          console.log(`🔍 Translation ${translationCode} ready with ${translationMap.size} verses`);
        } else {
          console.warn(`🔍 Failed to load translation: ${translationCode}`);
        }
      }
      
      // DIRECT SEARCH - Simple text matching across all loaded translations
      const directResults: SearchResult[] = [];
      const searchTerm = searchQuery.toLowerCase().trim();
      
      verses.forEach((verse, index) => {
        // Search each translation for this verse
        translationsToSearch.forEach(translation => {
          let verseText = '';
          
          // First try to get from currently loaded system
          verseText = getVerseText(verse.reference, translation) || '';
          
          // If not available, try from newly loaded translation maps
          if (!verseText || !verseText.trim()) {
            const translationMap = translationMaps.get(translation);
            if (translationMap) {
              verseText = translationMap.get(verse.reference) || '';
            }
          }
          
          if (verseText && verseText.toLowerCase().includes(searchTerm)) {
            const highlightedText = verseText.replace(
              new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
              '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
            );
            
            directResults.push({
              verseId: `${verse.reference}-${translation}`,
              reference: verse.reference,
              text: verseText,
              index,
              highlightedText,
              type: 'text',
              confidence: 0.9,
              translationCode: translation
            });
          }
        });
      });
      
      const results = directResults;
      console.log(`🔍 REAL SEARCH FOUND ${results.length} direct matches across ${translationsToSearch.join(', ')}`);
      
      // Use the direct results (they're already text-only)
      const textResults = results.sort((a, b) => b.confidence - a.confidence);
      
      console.log(`🔍 REAL SEARCH FINAL: ${textResults.length} results found`);
      if (textResults.length > 0) {
        console.log(`🔍 First result:`, textResults[0]);
      }
      
      setAllResults(textResults);
      setSearchResults(textResults.slice(0, displayedResults));
      
      // Don't auto-select - let user manually navigate with arrow keys
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
    console.log(`🎯 Navigating to verse: ${result.reference} from search result`);
    console.log(`🎯 Translation switching to: ${result.translationCode}`);
    
    // Switch to the translation if it's different from current and we have the function
    if (result.translationCode && result.translationCode !== activeTranslation && onSwitchTranslation) {
      onSwitchTranslation(result.translationCode);
    }
    
    // Navigate to the verse (use reference, not verseId which has translation suffix)
    onNavigateToVerse(result.reference);
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

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              {isMobile ? 'Search' : 'Text Search'}
            </TabsTrigger>
            <TabsTrigger value="navigate" className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              {isMobile ? 'Navigate' : 'Navigate to Verse'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 mt-4">
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
              <Button 
                variant="outline" 
                onClick={getRandomVerse}
                title={isMobile ? "Random Verse" : "Random Verse (Ctrl+R)"}
                className={isMobile ? "px-3" : ""}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              {!isMobile && (
                <Button
                  variant={showHistory ? 'default' : 'outline'}
                  onClick={() => setShowHistory(!showHistory)}
                  title="Search History (Ctrl+H)"
                  disabled={searchHistory.length === 0}
                >
                  <History className="w-4 h-4" />
                </Button>
              )}
            </div>

          {/* Translation Selection */}
          {!isMobile && (
            <div className="flex flex-wrap gap-2">
              {/* Individual Translation Checkboxes */}
              <div className="flex flex-wrap items-center gap-2 border rounded-md p-2 max-w-full">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Search in:</span>
                {['AMP', 'BSB', 'CSB', 'ESV', 'KJV', 'LSB', 'NASB', 'NIV', 'NKJV', 'NLT', 'NRSV', 'WEB', 'YLT'].map(translation => (
                  <label key={translation} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTranslations.includes(translation)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTranslations(prev => [...prev, translation]);
                        } else {
                          setSelectedTranslations(prev => prev.filter(t => t !== translation));
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium">{translation}</span>
                  </label>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allTranslations = ['AMP', 'BSB', 'CSB', 'ESV', 'KJV', 'LSB', 'NASB', 'NIV', 'NKJV', 'NLT', 'NRSV', 'WEB', 'YLT'];
                    setSelectedTranslations(
                      selectedTranslations.length === allTranslations.length ? [activeTranslation] : allTranslations
                    );
                  }}
                  className="h-6 px-2 text-xs ml-2"
                >
                  {selectedTranslations.length === 13 ? 'Clear All' : 'Select All'}
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

          {/* Mobile Translation Selection */}
          {isMobile && (
            <div className="border rounded-md p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Search in:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allTranslations = ['AMP', 'BSB', 'CSB', 'ESV', 'KJV', 'LSB', 'NASB', 'NIV', 'NKJV', 'NLT', 'NRSV', 'WEB', 'YLT'];
                    setSelectedTranslations(
                      selectedTranslations.length === allTranslations.length ? [activeTranslation] : allTranslations
                    );
                  }}
                  className="h-6 px-2 text-xs"
                >
                  {selectedTranslations.length === 13 ? 'Clear All' : 'Select All'}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {['AMP', 'BSB', 'CSB', 'ESV', 'KJV', 'LSB', 'NASB', 'NIV', 'NKJV', 'NLT', 'NRSV', 'WEB', 'YLT'].map(translation => (
                  <label key={translation} className="flex items-center gap-1 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={selectedTranslations.includes(translation)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTranslations(prev => [...prev, translation]);
                        } else {
                          setSelectedTranslations(prev => prev.filter(t => t !== translation));
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                    />
                    <span className="font-medium">{translation}</span>
                  </label>
                ))}
              </div>
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
              
              {/* Translation Selection */}
              <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium">Search Translations</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Select translations to search (click results to switch main translation):
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['KJV', 'ESV', 'NIV', 'NLT', 'NASB', 'CSB', 'AMP', 'BSB', 'WEB', 'YLT', 'LSB', 'NKJV'].map(translation => (
                    <label key={translation} className="flex items-center space-x-1 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedTranslations.includes(translation)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTranslations(prev => [...prev, translation]);
                          } else {
                            setSelectedTranslations(prev => prev.filter(t => t !== translation));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={translation === activeTranslation ? 'font-bold text-blue-600' : ''}>
                        {translation}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
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
                          {result.translationCode && (
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
          </TabsContent>

          <TabsContent value="navigate" className="mt-4">
            <ScrollWheelSelector 
              onNavigate={(reference) => {
                console.log(`📍 Navigating to verse from scroll wheel: ${reference}`);
                onNavigateToVerse(reference);
                onClose();
              }}
              className="w-full"
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}