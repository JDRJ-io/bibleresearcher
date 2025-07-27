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
  onNavigateToVerse: (verseIndex: number) => void;
}

export function SearchModal({ isOpen, onClose, onNavigateToVerse }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxResults, setMaxResults] = useState(50);
  const [searchType, setSearchType] = useState<'all' | 'exact' | 'reference'>('all');
  
  const bibleStore = useBibleStore();
  const verses = bibleStore?.currentVerseKeys || [];
  const { mainTranslation: activeTranslation } = useTranslationMaps();
  
  // Create search engine instance
  const searchEngine = useMemo(() => {
    return new BibleSearchEngine(verses);
  }, [verses]);

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
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const results = searchEngine.search(searchQuery, activeTranslation, maxResults);
      
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
    onNavigateToVerse(result.index);
    onClose();
  };

  const getRandomVerse = () => {
    if (verses.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * verses.length);
    onNavigateToVerse(randomIndex);
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                <label className="text-sm font-medium mb-2 block">Translation</label>
                <div className="p-2 border rounded-md bg-gray-100 dark:bg-gray-600 text-sm">
                  {activeTranslation}
                </div>
              </div>
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