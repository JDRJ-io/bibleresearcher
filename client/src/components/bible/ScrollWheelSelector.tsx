import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Bible books in order
const BIBLE_BOOKS = [
  // Old Testament
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  // New Testament
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

// Chapter counts for each book
const CHAPTER_COUNTS: Record<string, number> = {
  'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
  'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
  'Ezra': 10, 'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150, 'Proverbs': 31,
  'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66, 'Jeremiah': 52, 'Lamentations': 5,
  'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14, 'Joel': 3, 'Amos': 9,
  'Obadiah': 1, 'Jonah': 4, 'Micah': 7, 'Nahum': 3, 'Habakkuk': 3,
  'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14, 'Malachi': 4,
  'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
  'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6, 'Ephesians': 6,
  'Philippians': 4, 'Colossians': 4, '1 Thessalonians': 5, '2 Thessalonians': 3,
  '1 Timothy': 6, '2 Timothy': 4, 'Titus': 3, 'Philemon': 1,
  'Hebrews': 13, 'James': 5, '1 Peter': 5, '2 Peter': 3,
  '1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22
};

// Common verse counts (approximations for UI purposes)
const getMaxVerses = (book: string, chapter: number): number => {
  // This is a simplified approach - in a real app you'd have exact verse counts
  if (book === 'Psalms') return chapter === 119 ? 176 : 25;
  if (book === 'Genesis' && chapter === 1) return 31;
  if (book === 'John' && chapter === 3) return 36;
  if (book === 'Romans' && chapter === 8) return 39;
  return 35; // Default approximation
};

interface ScrollWheelSelectorProps {
  onNavigate: (reference: string) => void;
  className?: string;
}

interface WheelSelectorProps {
  items: (string | number)[];
  selectedIndex: number;
  onSelectionChange: (index: number) => void;
  label: string;
}

function WheelSelector({ items, selectedIndex, onSelectionChange, label }: WheelSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const itemHeight = 40; // Height of each item
      scrollRef.current.scrollTop = index * itemHeight;
    }
  };

  useEffect(() => {
    scrollToIndex(selectedIndex);
  }, [selectedIndex]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      const itemHeight = 40;
      const newIndex = Math.round(scrollTop / itemHeight);
      if (newIndex !== selectedIndex && newIndex >= 0 && newIndex < items.length) {
        onSelectionChange(newIndex);
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {label}
      </div>
      
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10"
          onClick={() => onSelectionChange(Math.max(0, selectedIndex - 1))}
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
        
        <div 
          ref={scrollRef}
          className="h-[120px] w-24 overflow-y-auto scroll-smooth bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-blue-200 dark:border-blue-700 relative scrollbar-hide"
          onScroll={handleScroll}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >

          
          {/* Selection indicator */}
          <div 
            className="absolute left-0 right-0 h-[40px] bg-blue-500/20 border-y-2 border-blue-500 pointer-events-none z-10"
            style={{
              top: '40px' // Center position
            }}
          />
          
          {/* Padding items for smooth scrolling */}
          <div className="h-[40px]" />
          <div className="h-[40px]" />
          
          {items.map((item, index) => (
            <div
              key={`${label}-${index}`}
              className={`h-[40px] flex items-center justify-center text-sm font-medium cursor-pointer transition-colors ${
                index === selectedIndex 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => onSelectionChange(index)}
            >
              {item}
            </div>
          ))}
          
          {/* Padding items for smooth scrolling */}
          <div className="h-[40px]" />
          <div className="h-[40px]" />
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-10"
          onClick={() => onSelectionChange(Math.min(items.length - 1, selectedIndex + 1))}
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function ScrollWheelSelector({ onNavigate, className }: ScrollWheelSelectorProps) {
  const [selectedBookIndex, setSelectedBookIndex] = useState(0); // Genesis
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(1);

  const selectedBook = BIBLE_BOOKS[selectedBookIndex];
  const maxChapters = CHAPTER_COUNTS[selectedBook] || 1;
  const maxVerses = getMaxVerses(selectedBook, selectedChapter);

  // Reset chapter and verse when book changes
  useEffect(() => {
    setSelectedChapter(1);
    setSelectedVerse(1);
  }, [selectedBookIndex]);

  // Reset verse when chapter changes
  useEffect(() => {
    setSelectedVerse(1);
  }, [selectedChapter]);

  const chapters = Array.from({ length: maxChapters }, (_, i) => i + 1);
  const verses = Array.from({ length: maxVerses }, (_, i) => i + 1);

  const handleNavigate = () => {
    // Convert book name to abbreviation for consistent reference format
    const bookAbbreviation = selectedBook.replace(/\s+/g, '.');
    const reference = `${bookAbbreviation}.${selectedChapter}:${selectedVerse}`;
    console.log('📍 ScrollWheelSelector navigating to:', reference);
    onNavigate(reference);
  };

  const getCurrentReference = () => {
    const bookAbbreviation = selectedBook.replace(/\s+/g, '.');
    return `${bookAbbreviation}.${selectedChapter}:${selectedVerse}`;
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Navigate to Verse</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Use the scroll wheels to select book, chapter, and verse
          </p>
        </div>

        <div className="flex justify-center items-start space-x-8">
          <WheelSelector
            items={BIBLE_BOOKS}
            selectedIndex={selectedBookIndex}
            onSelectionChange={setSelectedBookIndex}
            label="Book"
          />
          
          <WheelSelector
            items={chapters}
            selectedIndex={selectedChapter - 1}
            onSelectionChange={(index) => setSelectedChapter(index + 1)}
            label="Chapter"
          />
          
          <WheelSelector
            items={verses}
            selectedIndex={selectedVerse - 1}
            onSelectionChange={(index) => setSelectedVerse(index + 1)}
            label="Verse"
          />
        </div>

        <div className="text-center space-y-4">
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {getCurrentReference()}
          </div>
          
          <Button 
            onClick={handleNavigate}
            className="flex items-center gap-2"
            size="lg"
          >
            <Navigation className="w-4 h-4" />
            Go to Verse
          </Button>
        </div>
      </div>
    </Card>
  );
}