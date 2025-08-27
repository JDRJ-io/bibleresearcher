import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter, ArrowUp, ArrowDown, History, Clock, Zap, Target, Shuffle, Keyboard, BookOpen, ChevronRight } from 'lucide-react';
import { useBibleStore } from '@/App';
import { LoadingWheel } from '@/components/LoadingWheel';
import { BibleSearchEngine, type SearchResult } from '@/lib/bibleSearchEngine';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';

// Bible books data for navigation (using correct canonical names)
const BIBLE_BOOKS = [
  // Old Testament
  { name: 'Genesis', abbrev: 'Gen', chapters: 50 },
  { name: 'Exodus', abbrev: 'Exo', chapters: 40 },
  { name: 'Leviticus', abbrev: 'Lev', chapters: 27 },
  { name: 'Numbers', abbrev: 'Num', chapters: 36 },
  { name: 'Deuteronomy', abbrev: 'Deu', chapters: 34 },
  { name: 'Joshua', abbrev: 'Jos', chapters: 24 },
  { name: 'Judges', abbrev: 'Jdg', chapters: 21 },
  { name: 'Ruth', abbrev: 'Rut', chapters: 4 },
  { name: '1 Samuel', abbrev: '1Sa', chapters: 31 },
  { name: '2 Samuel', abbrev: '2Sa', chapters: 24 },
  { name: '1 Kings', abbrev: '1Ki', chapters: 22 },
  { name: '2 Kings', abbrev: '2Ki', chapters: 25 },
  { name: '1 Chronicles', abbrev: '1Ch', chapters: 29 },
  { name: '2 Chronicles', abbrev: '2Ch', chapters: 36 },
  { name: 'Ezra', abbrev: 'Ezr', chapters: 10 },
  { name: 'Nehemiah', abbrev: 'Neh', chapters: 13 },
  { name: 'Esther', abbrev: 'Est', chapters: 10 },
  { name: 'Job', abbrev: 'Job', chapters: 42 },
  { name: 'Psalms', abbrev: 'Psa', chapters: 150 },
  { name: 'Proverbs', abbrev: 'Pro', chapters: 31 },
  { name: 'Ecclesiastes', abbrev: 'Ecc', chapters: 12 },
  { name: 'Song of Solomon', abbrev: 'Sng', chapters: 8 },
  { name: 'Isaiah', abbrev: 'Isa', chapters: 66 },
  { name: 'Jeremiah', abbrev: 'Jer', chapters: 52 },
  { name: 'Lamentations', abbrev: 'Lam', chapters: 5 },
  { name: 'Ezekiel', abbrev: 'Ezk', chapters: 48 },
  { name: 'Daniel', abbrev: 'Dan', chapters: 12 },
  { name: 'Hosea', abbrev: 'Hos', chapters: 14 },
  { name: 'Joel', abbrev: 'Jol', chapters: 3 },
  { name: 'Amos', abbrev: 'Amo', chapters: 9 },
  { name: 'Obadiah', abbrev: 'Oba', chapters: 1 },
  { name: 'Jonah', abbrev: 'Jon', chapters: 4 },
  { name: 'Micah', abbrev: 'Mic', chapters: 7 },
  { name: 'Nahum', abbrev: 'Nah', chapters: 3 },
  { name: 'Habakkuk', abbrev: 'Hab', chapters: 3 },
  { name: 'Zephaniah', abbrev: 'Zep', chapters: 3 },
  { name: 'Haggai', abbrev: 'Hag', chapters: 2 },
  { name: 'Zechariah', abbrev: 'Zec', chapters: 14 },
  { name: 'Malachi', abbrev: 'Mal', chapters: 4 },
  // New Testament
  { name: 'Matthew', abbrev: 'Mat', chapters: 28 },
  { name: 'Mark', abbrev: 'Mar', chapters: 16 },
  { name: 'Luke', abbrev: 'Luk', chapters: 24 },
  { name: 'John', abbrev: 'Joh', chapters: 21 },
  { name: 'Acts', abbrev: 'Act', chapters: 28 },
  { name: 'Romans', abbrev: 'Rom', chapters: 16 },
  { name: '1 Corinthians', abbrev: '1Co', chapters: 16 },
  { name: '2 Corinthians', abbrev: '2Co', chapters: 13 },
  { name: 'Galatians', abbrev: 'Gal', chapters: 6 },
  { name: 'Ephesians', abbrev: 'Eph', chapters: 6 },
  { name: 'Philippians', abbrev: 'Phi', chapters: 4 },
  { name: 'Colossians', abbrev: 'Col', chapters: 4 },
  { name: '1 Thessalonians', abbrev: '1Th', chapters: 5 },
  { name: '2 Thessalonians', abbrev: '2Th', chapters: 3 },
  { name: '1 Timothy', abbrev: '1Ti', chapters: 6 },
  { name: '2 Timothy', abbrev: '2Ti', chapters: 4 },
  { name: 'Titus', abbrev: 'Tit', chapters: 3 },
  { name: 'Philemon', abbrev: 'Phm', chapters: 1 },
  { name: 'Hebrews', abbrev: 'Heb', chapters: 13 },
  { name: 'James', abbrev: 'Jas', chapters: 5 },
  { name: '1 Peter', abbrev: '1Pe', chapters: 5 },
  { name: '2 Peter', abbrev: '2Pe', chapters: 3 },
  { name: '1 John', abbrev: '1Jo', chapters: 5 },
  { name: '2 John', abbrev: '2Jo', chapters: 1 },
  { name: '3 John', abbrev: '3Jo', chapters: 1 },
  { name: 'Jude', abbrev: 'Jud', chapters: 1 },
  { name: 'Revelation', abbrev: 'Rev', chapters: 22 }
];

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
  // SearchModal render logs removed for performance
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [displayedResults, setDisplayedResults] = useState(50);
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  // Removed searchAllTranslations toggle - now using individual translation selection
  
  // Advanced navigation state
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [selectedTranslations, setSelectedTranslations] = useState<string[]>(['KJV']);
  
  // Navigation picker state
  const [selectedBook, setSelectedBook] = useState<string>('Gen');
  const [selectedChapter, setSelectedChapter] = useState<string>('1');
  
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
      // Loading translation for search (logging removed for performance)
      const { loadTranslation } = await import('@/data/BibleDataAPI');
      const translationMap = await loadTranslation(translationCode);
      
      if (translationMap && translationMap.size > 0) {
        setLoadedTranslations(prev => new Map(prev).set(translationCode, translationMap));
        return translationMap;
      }
    } catch (error) {
      // Translation loading error (logging removed for performance)
    }
    
    return null;
  };

  // Create verse objects with text content for search engine
  const versesWithText = useMemo(() => {
    // SearchModal versesWithText memo logs removed for performance
    
    if (!verses.length || !getVerseText) {
      return [];
    }
    
    const result = verses.map((verse, index) => {
      // Get text for currently loaded translations using your working system
      const textObj: Record<string, string> = {};
      const currentlyLoadedTranslations = ['KJV', 'BSB', 'WEB', 'YLT'];
      
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
    
    // SearchModal versesWithText creation logs removed for performance
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
          // Advanced toggle removed - functionality is now always visible
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

  // Navigation picker handlers
  const selectedBookData = BIBLE_BOOKS.find(book => book.abbrev === selectedBook);
  const maxChapter = selectedBookData?.chapters || 1;

  const handleNavigateToReference = () => {
    const reference = `${selectedBook}.${selectedChapter}:1`;
    console.log(`📖 Navigation picker navigating to: ${reference}`);
    onNavigateToVerse(reference);
    onClose();
  };

  const handleBookChange = (value: string) => {
    setSelectedBook(value);
    setSelectedChapter('1');
    setSelectedVerse('1');
  };

  const handleChapterChange = (value: string) => {
    setSelectedChapter(value);
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
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Ultra Compact Navigation */}
          <div className="flex items-center gap-1 text-xs bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 border">
            <BookOpen className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <Select value={selectedBook} onValueChange={handleBookChange}>
              <SelectTrigger className="h-6 text-xs border-0 p-1 min-w-0 w-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {BIBLE_BOOKS.map(book => (
                  <SelectItem key={book.abbrev} value={book.abbrev} className="text-xs py-1">
                    {book.abbrev}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedChapter} onValueChange={handleChapterChange}>
              <SelectTrigger className="h-6 text-xs border-0 p-1 min-w-0 w-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {Array.from({ length: maxChapter }, (_, i) => i + 1).map(chapter => (
                  <SelectItem key={chapter} value={chapter.toString()} className="text-xs py-1">
                    {chapter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleNavigateToReference}
              size="sm"
              className="h-6 px-2 bg-green-600 hover:bg-green-700 text-white text-xs"
              title="Navigate to chapter"
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>

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
              <Button 
                onClick={performSearch} 
                disabled={isSearching}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 min-w-[100px] shadow-lg hover:shadow-xl transition-all duration-200 holy-button"
                title="Search Verses (Enter)"
              >
                {isSearching ? (
                  <LoadingWheel />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={getRandomVerse}
                title="Random Verse (Ctrl+R)"
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              <Button
                variant={showHistory ? 'default' : 'outline'}
                onClick={() => setShowHistory(!showHistory)}
                title="Search History (Ctrl+H)"
                disabled={searchHistory.length === 0}
              >
                <History className="w-4 h-4" />
              </Button>
            </div>

          {/* Translation Selection - Compact Version */}
          <div className="flex flex-wrap gap-2">
            {/* Individual Translation Checkboxes */}
            <div className="flex flex-wrap items-center gap-2 border rounded-md p-2 max-w-full">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Search in:</span>
              {['KJV', 'BSB', 'WEB', 'YLT'].map(translation => (
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
                  const allTranslations = ['KJV', 'BSB', 'WEB', 'YLT'];
                  setSelectedTranslations(
                    selectedTranslations.length === allTranslations.length ? [activeTranslation] : allTranslations
                  );
                }}
                className="h-6 px-2 text-xs ml-2"
              >
                {selectedTranslations.length === 4 ? 'Clear All' : 'Select All'}
              </Button>
            </div>

            {!isMobile && (
              <>
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
              </>
            )}

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