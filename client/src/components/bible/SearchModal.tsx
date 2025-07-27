import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Book, Filter, ArrowUp, ArrowDown, Settings } from 'lucide-react';
import { useBibleStore } from '@/App';
import { LoadingWheel } from '@/components/LoadingWheel';
import { BibleSearchEngine, type SearchResult } from '@/lib/bibleSearchEngine';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVerse: (verseReference: string) => void;
}

export function SearchModal({ isOpen, onClose, onNavigateToVerse }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxResults, setMaxResults] = useState(50);
  const [searchType, setSearchType] = useState<'all' | 'exact' | 'reference'>('all');
  const [searchAllTranslations, setSearchAllTranslations] = useState(false);
  
  const bibleStore = useBibleStore();
  const verseKeys = bibleStore?.currentVerseKeys || [];
  const { mainTranslation: activeTranslation, getVerseText } = useTranslationMaps();
  
  // Create verse objects with text content for search engine
  const versesWithText = useMemo(() => {
    if (!verseKeys.length || !getVerseText) return [];
    
    return verseKeys.slice(0, 1000).map((key, index) => {
      // Get text for all available translations using your working system
      const textObj: Record<string, string> = {};
      const translations = ['KJV', 'ESV', 'NIV', 'NLT', 'NASB', 'CSB', 'AMP', 'BSB', 'WEB', 'YLT', 'LSB', 'NKJV'];
      
      translations.forEach(translationCode => {
        const text = getVerseText(key, translationCode);
        if (text) {
          textObj[translationCode] = text;
        }
      });
      
      return {
        id: key,
        reference: key.replace('.', ' '), // Convert Gen.1:1 to Gen 1:1
        text: textObj,
        index
      };
    });
  }, [verseKeys, getVerseText, activeTranslation]);
  
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
    }
  }, [isOpen]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    if (!versesWithText.length) {
      console.warn('Search: No verse data available yet. Loaded verses:', versesWithText.length);
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`🔍 Searching "${searchQuery}" across ${versesWithText.length} verses with translation: ${activeTranslation}`);
      
      const results = searchEngine.search(searchQuery, activeTranslation, maxResults, searchAllTranslations);
      
      console.log(`🔍 Search found ${results.length} results`);
      
      // Filter by search type if specified
      const filteredResults = searchType === 'all' ? results : 
        results.filter(r => {
          if (searchType === 'exact') return r.type === 'text' && r.confidence > 0.5;
          if (searchType === 'reference') return r.type === 'reference';
          return true;
        });
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onNavigateToVerse(result.verseId);
    onClose();
  };

  const getRandomVerse = () => {
    if (verseKeys.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * verseKeys.length);
    const randomVerseKey = verseKeys[randomIndex];
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
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Intelligent Bible Search
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1"
            >
              <Settings className="w-4 h-4" />
              {showAdvanced ? 'Simple' : 'Advanced'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Try: 'John 3:16', 'love', 'Gen 1', 'Psalm 23:1-3', or any book/verse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              autoFocus
            />
            <Button onClick={performSearch} disabled={isSearching}>
              {isSearching ? <LoadingWheel /> : <Search className="w-4 h-4" />}
            </Button>
            <Button variant="outline" onClick={getRandomVerse}>
              <Book className="w-4 h-4" />
            </Button>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search Type</label>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as any)}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-700"
                  >
                    <option value="all">All Results</option>
                    <option value="reference">References Only</option>
                    <option value="exact">Text Matches Only</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Max Results</label>
                  <select
                    value={maxResults}
                    onChange={(e) => setMaxResults(Number(e.target.value))}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-700"
                  >
                    <option value={25}>25 results</option>
                    <option value={50}>50 results</option>
                    <option value={100}>100 results</option>
                    <option value={500}>500 results</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Primary Translation</label>
                  <div className="p-2 border rounded-md bg-gray-100 dark:bg-gray-600 text-sm">
                    {activeTranslation}
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

          {/* Search Examples */}
          {!hasSearched && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-2">Search Examples:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <strong>Verse References:</strong>
                  <ul className="ml-4 space-y-1">
                    <li>• "John 3:16" or "Jn 3:16"</li>
                    <li>• "Gen 1:1-3" (verse range)</li>
                    <li>• "Psalm 23" (whole chapter)</li>
                    <li>• "Romans" (whole book)</li>
                  </ul>
                </div>
                <div>
                  <strong>Text Search:</strong>
                  <ul className="ml-4 space-y-1">
                    <li>• "love your enemies"</li>
                    <li>• "faith hope love"</li>
                    <li>• "in the beginning"</li>
                    <li>• "fear not"</li>
                  </ul>
                </div>
              </div>
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
                  {showAdvanced && (
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">Ref</Badge>
                      <Badge variant="outline" className="text-xs">Text</Badge>
                      <Badge variant="outline" className="text-xs">Confidence</Badge>
                    </div>
                  )}
                </div>
                
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.verseId}-${index}`}
                      onClick={() => handleResultClick(result)}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {result.reference}
                          </span>
                          {result.translationCode && searchAllTranslations && (
                            <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              {result.translationCode}
                            </Badge>
                          )}
                          {showAdvanced && (
                            <>
                              <Badge className={`text-xs ${getSearchTypeColor(result.type)}`}>
                                {result.type}
                              </Badge>
                              <span className={`text-xs ${getConfidenceColor(result.confidence)}`}>
                                {Math.round(result.confidence * 100)}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div 
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: result.highlightedText }}
                      />
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