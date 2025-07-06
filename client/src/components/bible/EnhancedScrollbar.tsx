import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getVerseKeys, getVerseKeyByIndex } from '../../lib/verseKeysLoader';

interface EnhancedScrollbarProps {
  containerRef: React.RefObject<HTMLDivElement>;
  anchorIndex: number;
  totalVerses: number;
  onScrollToIndex: (index: number) => void;
}

interface BibleBook {
  name: string;
  startIndex: number;
  endIndex: number;
  verseCount: number;
}

// Bible book boundaries with mystical color themes
const BIBLE_BOOKS: BibleBook[] = [
  { name: "Genesis", startIndex: 0, endIndex: 1532, verseCount: 1533 },
  { name: "Exodus", startIndex: 1533, endIndex: 2743, verseCount: 1211 },
  { name: "Leviticus", startIndex: 2744, endIndex: 3602, verseCount: 859 },
  { name: "Numbers", startIndex: 3603, endIndex: 4888, verseCount: 1286 },
  { name: "Deuteronomy", startIndex: 4889, endIndex: 5847, verseCount: 959 },
  { name: "Joshua", startIndex: 5848, endIndex: 6505, verseCount: 658 },
  { name: "Judges", startIndex: 6506, endIndex: 7123, verseCount: 618 },
  { name: "Ruth", startIndex: 7124, endIndex: 7208, verseCount: 85 },
  { name: "1 Samuel", startIndex: 7209, endIndex: 8018, verseCount: 810 },
  { name: "2 Samuel", startIndex: 8019, endIndex: 8713, verseCount: 695 },
  { name: "1 Kings", startIndex: 8714, endIndex: 9530, verseCount: 817 },
  { name: "2 Kings", startIndex: 9531, endIndex: 10249, verseCount: 719 },
  { name: "1 Chronicles", startIndex: 10250, endIndex: 11191, verseCount: 942 },
  { name: "2 Chronicles", startIndex: 11192, endIndex: 12014, verseCount: 822 },
  { name: "Ezra", startIndex: 12015, endIndex: 12294, verseCount: 280 },
  { name: "Nehemiah", startIndex: 12295, endIndex: 12700, verseCount: 406 },
  { name: "Esther", startIndex: 12701, endIndex: 12867, verseCount: 167 },
  { name: "Job", startIndex: 12868, endIndex: 13937, verseCount: 1070 },
  { name: "Psalms", startIndex: 13938, endIndex: 16404, verseCount: 2467 },
  { name: "Proverbs", startIndex: 16405, endIndex: 17319, verseCount: 915 },
  { name: "Ecclesiastes", startIndex: 17320, endIndex: 17541, verseCount: 222 },
  { name: "Song of Solomon", startIndex: 17542, endIndex: 17658, verseCount: 117 },
  { name: "Isaiah", startIndex: 17659, endIndex: 18951, verseCount: 1293 },
  { name: "Jeremiah", startIndex: 18952, endIndex: 20315, verseCount: 1364 },
  { name: "Lamentations", startIndex: 20316, endIndex: 20469, verseCount: 154 },
  { name: "Ezekiel", startIndex: 20470, endIndex: 21742, verseCount: 1273 },
  { name: "Daniel", startIndex: 21743, endIndex: 22099, verseCount: 357 },
  { name: "Hosea", startIndex: 22100, endIndex: 22296, verseCount: 197 },
  { name: "Joel", startIndex: 22297, endIndex: 22369, verseCount: 73 },
  { name: "Amos", startIndex: 22370, endIndex: 22516, verseCount: 147 },
  { name: "Obadiah", startIndex: 22517, endIndex: 22537, verseCount: 21 },
  { name: "Jonah", startIndex: 22538, endIndex: 22585, verseCount: 48 },
  { name: "Micah", startIndex: 22586, endIndex: 22690, verseCount: 105 },
  { name: "Nahum", startIndex: 22691, endIndex: 22737, verseCount: 47 },
  { name: "Habakkuk", startIndex: 22738, endIndex: 22793, verseCount: 56 },
  { name: "Zephaniah", startIndex: 22794, endIndex: 22846, verseCount: 53 },
  { name: "Haggai", startIndex: 22847, endIndex: 22884, verseCount: 38 },
  { name: "Zechariah", startIndex: 22885, endIndex: 23095, verseCount: 211 },
  { name: "Malachi", startIndex: 23096, endIndex: 23150, verseCount: 55 },
  { name: "Matthew", startIndex: 23151, endIndex: 24221, verseCount: 1071 },
  { name: "Mark", startIndex: 24222, endIndex: 24897, verseCount: 676 },
  { name: "Luke", startIndex: 24898, endIndex: 26049, verseCount: 1152 },
  { name: "John", startIndex: 26050, endIndex: 26929, verseCount: 880 },
  { name: "Acts", startIndex: 26930, endIndex: 27936, verseCount: 1007 },
  { name: "Romans", startIndex: 27937, endIndex: 28369, verseCount: 433 },
  { name: "1 Corinthians", startIndex: 28370, endIndex: 28816, verseCount: 437 },
  { name: "2 Corinthians", startIndex: 28817, endIndex: 29073, verseCount: 257 },
  { name: "Galatians", startIndex: 29074, endIndex: 29222, verseCount: 149 },
  { name: "Ephesians", startIndex: 29223, endIndex: 29377, verseCount: 155 },
  { name: "Philippians", startIndex: 29378, endIndex: 29481, verseCount: 104 },
  { name: "Colossians", startIndex: 29482, endIndex: 29576, verseCount: 95 },
  { name: "1 Thessalonians", startIndex: 29577, endIndex: 29665, verseCount: 89 },
  { name: "2 Thessalonians", startIndex: 29666, endIndex: 29712, verseCount: 47 },
  { name: "1 Timothy", startIndex: 29713, endIndex: 29825, verseCount: 113 },
  { name: "2 Timothy", startIndex: 29826, endIndex: 29908, verseCount: 83 },
  { name: "Titus", startIndex: 29909, endIndex: 29954, verseCount: 46 },
  { name: "Philemon", startIndex: 29955, endIndex: 29979, verseCount: 25 },
  { name: "Hebrews", startIndex: 29980, endIndex: 30282, verseCount: 303 },
  { name: "James", startIndex: 30283, endIndex: 30390, verseCount: 108 },
  { name: "1 Peter", startIndex: 30391, endIndex: 30495, verseCount: 105 },
  { name: "2 Peter", startIndex: 30496, endIndex: 30556, verseCount: 61 },
  { name: "1 John", startIndex: 30557, endIndex: 30661, verseCount: 105 },
  { name: "2 John", startIndex: 30662, endIndex: 30674, verseCount: 13 },
  { name: "3 John", startIndex: 30675, endIndex: 30689, verseCount: 15 },
  { name: "Jude", startIndex: 30690, endIndex: 30714, verseCount: 25 },
  { name: "Revelation", startIndex: 30715, endIndex: 31101, verseCount: 387 }
];

const EnhancedScrollbar: React.FC<EnhancedScrollbarProps> = ({
  containerRef,
  anchorIndex,
  totalVerses,
  onScrollToIndex
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewVerse, setPreviewVerse] = useState<string>('');
  const [currentBook, setCurrentBook] = useState<BibleBook | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Find current book based on anchor index
  const findCurrentBook = useCallback((index: number): BibleBook | null => {
    return BIBLE_BOOKS.find(book => index >= book.startIndex && index <= book.endIndex) || null;
  }, []);

  // Update current book when anchor changes
  useEffect(() => {
    const book = findCurrentBook(anchorIndex);
    setCurrentBook(book);
  }, [anchorIndex, findCurrentBook]);

  // Calculate scroll position as percentage
  const scrollPercentage = Math.min(100, Math.max(0, (anchorIndex / totalVerses) * 100));

  // Handle drag functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = Math.min(100, Math.max(0, (y / rect.height) * 100));
    const targetIndex = Math.floor((percentage / 100) * totalVerses);
    
    setHoverIndex(targetIndex);
    const verseKey = getVerseKeyByIndex(targetIndex);
    setPreviewVerse(verseKey);
    
    onScrollToIndex(targetIndex);
  }, [isDragging, totalVerses, onScrollToIndex]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setHoverIndex(null);
    setPreviewVerse('');
  }, []);

  // Handle click to jump
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = (y / rect.height) * 100;
    const targetIndex = Math.floor((percentage / 100) * totalVerses);
    
    onScrollToIndex(targetIndex);
  }, [totalVerses, onScrollToIndex]);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="enhanced-scrollbar fixed right-0 top-0 h-full z-50 flex items-center">
      {/* Live Preview Tooltip */}
      {(isDragging || previewVerse) && (
        <div className="absolute right-12 bg-black/90 text-white px-3 py-2 rounded-lg shadow-xl border border-purple-500/30 backdrop-blur-sm"
             style={{ top: `${Math.min(90, Math.max(10, (hoverIndex || anchorIndex) / totalVerses * 100))}%` }}>
          <div className="text-sm font-medium text-purple-300">
            {previewVerse || getVerseKeyByIndex(anchorIndex)}
          </div>
          {currentBook && (
            <div className="text-xs text-gray-400 mt-1">
              {currentBook.name} • {Math.floor(((hoverIndex || anchorIndex) - currentBook.startIndex) / currentBook.verseCount * 100)}% through
            </div>
          )}
        </div>
      )}

      {/* Main Scrollbar Track */}
      <div 
        ref={scrollbarRef}
        className="relative group cursor-pointer"
        style={{ width: isDragging ? '24px' : '16px', transition: 'width 0.2s ease' }}
      >
        <div 
          ref={trackRef}
          className="relative h-screen bg-gradient-to-b from-indigo-900/30 to-purple-900/30 rounded-l-lg overflow-hidden border-l border-purple-500/20"
          onClick={handleTrackClick}
        >
          {/* Bible Book Segments */}
          {BIBLE_BOOKS.map((book, index) => {
            const startPercent = (book.startIndex / totalVerses) * 100;
            const heightPercent = (book.verseCount / totalVerses) * 100;
            const isOldTestament = index < 39;
            
            return (
              <div
                key={book.name}
                className={`absolute left-0 right-0 border-b border-white/10 ${
                  isOldTestament 
                    ? 'bg-gradient-to-r from-amber-600/20 to-orange-500/20' 
                    : 'bg-gradient-to-r from-blue-600/20 to-purple-500/20'
                } hover:brightness-125 transition-all duration-200`}
                style={{
                  top: `${startPercent}%`,
                  height: `${heightPercent}%`,
                }}
                title={`${book.name} (${book.verseCount} verses)`}
              >
                {/* Book Label for larger books */}
                {book.verseCount > 500 && (
                  <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-xs text-white/70 font-medium writing-mode-vertical truncate">
                    {book.name}
                  </div>
                )}
              </div>
            );
          })}

          {/* Current Position Indicator */}
          <div 
            className="absolute left-0 w-full bg-gradient-to-r from-white via-purple-300 to-white shadow-lg shadow-purple-500/50 z-10 transition-all duration-150"
            style={{
              top: `${scrollPercentage}%`,
              height: '4px',
              transform: 'translateY(-2px)',
              boxShadow: isDragging ? '0 0 20px rgba(168, 85, 247, 0.8)' : '0 0 10px rgba(168, 85, 247, 0.4)'
            }}
          />

          {/* Draggable Thumb */}
          <div 
            className={`absolute left-0 right-0 bg-gradient-to-r from-purple-400 to-indigo-400 rounded cursor-grab ${
              isDragging ? 'cursor-grabbing shadow-2xl shadow-purple-500/60' : 'shadow-lg shadow-purple-500/30'
            } transition-all duration-200 hover:brightness-110`}
            style={{
              top: `${Math.max(0, Math.min(95, scrollPercentage - 2.5))}%`,
              height: '20px',
              transform: isDragging ? 'scale(1.1)' : 'scale(1)',
            }}
            onMouseDown={handleMouseDown}
          />

          {/* Mystical Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent pointer-events-none" />
          
          {/* Progress Indicator */}
          <div 
            className="absolute left-0 bottom-0 bg-gradient-to-t from-purple-600/40 to-transparent transition-all duration-300"
            style={{ height: `${scrollPercentage}%` }}
          />
        </div>

        {/* Testament Divider */}
        <div 
          className="absolute right-0 w-1 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
          style={{ top: `${(BIBLE_BOOKS[38].endIndex / totalVerses) * 100}%` }}
          title="Old Testament / New Testament"
        />
      </div>
    </div>
  );
};

export default EnhancedScrollbar;