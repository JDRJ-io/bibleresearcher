import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Book } from 'lucide-react';
import { useBibleStore } from '@/App';
import { LoadingWheel } from '@/components/LoadingWheel';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVerse: (verseIndex: number) => void;
}

interface SearchResult {
  verseId: string;
  reference: string;
  text: string;
  index: number;
  highlightedText: string;
}

export function SearchModal({ isOpen, onClose, onNavigateToVerse }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const bibleStore = useBibleStore();
  const verses = bibleStore?.verses || [];
  const translations = bibleStore?.actives || [];
  const activeTranslation = translations[0] || 'KJV';

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
      
      const query = searchQuery.toLowerCase().trim();
      const results: SearchResult[] = [];
      
      // Search through verses in the active translation
      for (let i = 0; i < verses.length; i++) {
        const verse = verses[i];
        const text = verse.text[activeTranslation] || '';
        
        if (text.toLowerCase().includes(query)) {
          // Create highlighted text
          const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          const highlightedText = text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
          
          results.push({
            verseId: verse.id,
            reference: verse.reference,
            text: text,
            index: i,
            highlightedText
          });
          
          // Limit results for performance
          if (results.length >= 100) break;
        }
      }
      
      setSearchResults(results);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search the Bible
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for words or phrases..."
              className="pr-10"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Button onClick={performSearch} disabled={!searchQuery.trim() || isSearching}>
            {isSearching ? <LoadingWheel size="small" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={getRandomVerse}
            className="flex items-center gap-1"
          >
            <Book className="w-4 h-4" />
            Random Verse
          </Button>
          <Badge variant="secondary" className="text-xs">
            Searching in {activeTranslation}
          </Badge>
        </div>

        <div className="flex-1 overflow-auto">
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <LoadingWheel size="large" />
              <span className="ml-2">Searching...</span>
            </div>
          )}
          
          {!isSearching && hasSearched && searchResults.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No results found for "{searchQuery}"</p>
              <p className="text-sm mt-1">Try different keywords or check your spelling</p>
            </div>
          )}
          
          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Found {searchResults.length} results{searchResults.length >= 100 ? ' (showing first 100)' : ''}
              </div>
              
              {searchResults.map((result) => (
                <div
                  key={result.verseId}
                  className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {result.reference}
                    </Badge>
                  </div>
                  <div 
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: result.highlightedText }}
                  />
                </div>
              ))}
            </div>
          )}
          
          {!hasSearched && !isSearching && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Enter a word or phrase to search the Bible</p>
              <p className="text-sm mt-1">Use the Random Verse button to explore</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}