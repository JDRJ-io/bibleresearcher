import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X } from 'lucide-react';
import { searchVerses } from '@/data/BibleDataAPI';
import { useBibleStore } from '@/App';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerseSelect: (index: number) => void;
}

interface SearchResult {
  reference: string;
  text: string;
  index: number;
}

export default function SearchModal({ isOpen, onClose, onVerseSelect }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { actives } = useBibleStore();
  
  const currentTranslation = actives[0] || 'KJV';

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log(`🔍 Searching for "${query}" in ${currentTranslation}...`);
      const searchResults = await searchVerses(query.trim(), currentTranslation);
      setResults(searchResults);
      console.log(`✅ Found ${searchResults.length} results`);
    } catch (error) {
      console.error('❌ Search failed:', error);
      setResults([]);
    }
    setIsSearching(false);
  }, [query, currentTranslation]);

  const handleVerseClick = (result: SearchResult) => {
    console.log(`📖 Navigating to ${result.reference} (index ${result.index})`);
    onVerseSelect(result.index);
    onClose();
  };

  const handleRandomVerse = async () => {
    setQuery('%');
    setIsSearching(true);
    try {
      const randomResult = await searchVerses('%', currentTranslation);
      if (randomResult.length > 0) {
        setResults(randomResult);
        console.log(`🎲 Random verse: ${randomResult[0].reference}`);
      }
    } catch (error) {
      console.error('❌ Random verse failed:', error);
    }
    setIsSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query || query === '%') return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800 font-semibold">{part}</span> : 
        part
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Bible ({currentTranslation})
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter search terms or '%' for random verse..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            autoFocus
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
          <Button onClick={handleRandomVerse} variant="outline" disabled={isSearching}>
            Random
          </Button>
        </div>

        {results.length > 0 && (
          <ScrollArea className="flex-1 max-h-96">
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={`${result.reference}-${index}`}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleVerseClick(result)}
                >
                  <div className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
                    {result.reference}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {highlightMatch(result.text, query === '%' ? '' : query)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {query && results.length === 0 && !isSearching && (
          <div className="text-center text-gray-500 py-8">
            No results found for "{query}"
          </div>
        )}

        {!query && (
          <div className="text-center text-gray-500 py-8">
            Enter search terms to find verses, or use "%" for a random verse
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}