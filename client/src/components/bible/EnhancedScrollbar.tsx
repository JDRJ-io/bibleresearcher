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
  const [rotation, setRotation] = useState(0);
  const knobRef = useRef<HTMLDivElement>(null);

  // Calculate rotation based on scroll position
  const scrollPercentage = Math.min(100, Math.max(0, (anchorIndex / totalVerses) * 100));

  // Update rotation when anchor changes
  useEffect(() => {
    setRotation((scrollPercentage / 100) * 360);
  }, [scrollPercentage]);

  // Find current book
  const currentBook = BIBLE_BOOKS.find(book => anchorIndex >= book.startIndex && anchorIndex <= book.endIndex);

  // Handle knob drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !knobRef.current) return;

    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let degrees = (angle * 180) / Math.PI + 90;
    if (degrees < 0) degrees += 360;
    
    const percentage = (degrees / 360) * 100;
    const targetIndex = Math.floor((percentage / 100) * totalVerses);
    
    setRotation(degrees);
    const verseKey = getVerseKeyByIndex(targetIndex);
    setPreviewVerse(verseKey);
    
    onScrollToIndex(targetIndex);
  }, [isDragging, totalVerses, onScrollToIndex]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setPreviewVerse('');
  }, []);

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
    <div className="gold-mixer-knob fixed bottom-8 right-8 z-40">
      {/* Live Preview Tooltip */}
      {(isDragging || previewVerse) && (
        <div className="absolute bottom-20 right-0 bg-black/90 text-white px-4 py-2 rounded-lg shadow-2xl border border-amber-500/30 backdrop-blur-sm">
          <div className="text-sm font-medium text-amber-300">
            {previewVerse || getVerseKeyByIndex(anchorIndex)}
          </div>
          {currentBook && (
            <div className="text-xs text-gray-400 mt-1">
              {currentBook.name}
            </div>
          )}
        </div>
      )}

      {/* Main Gold Knob */}
      <div 
        ref={knobRef}
        className={`relative w-20 h-20 rounded-full cursor-grab select-none ${
          isDragging ? 'cursor-grabbing scale-110' : 'scale-100 hover:scale-105'
        } transition-all duration-200`}
        onMouseDown={handleMouseDown}
        style={{
          background: `conic-gradient(from 0deg, 
            #FFD700 0%, 
            #FFA500 25%, 
            #FF8C00 50%, 
            #DAA520 75%, 
            #FFD700 100%)`,
          boxShadow: isDragging 
            ? '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(0, 0, 0, 0.3)'
            : '0 8px 25px rgba(255, 215, 0, 0.4), 0 4px 10px rgba(0, 0, 0, 0.2), inset 0 0 15px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Knob Surface Details */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-300/40 to-transparent" />
        
        {/* Center Circle */}
        <div 
          className="absolute top-1/2 left-1/2 w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-800 to-amber-900 shadow-inner"
          style={{
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
          }}
        />
        
        {/* Rotation Indicator */}
        <div 
          className="absolute top-1 left-1/2 w-1 h-4 bg-amber-900 rounded-full -translate-x-1/2 origin-bottom"
          style={{
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            transformOrigin: '50% 100%'
          }}
        />
        
        {/* Grip Notches */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-2 bg-amber-800/60"
            style={{
              top: '4px',
              left: '50%',
              transformOrigin: '50% 36px',
              transform: `translateX(-50%) rotate(${i * 30}deg)`
            }}
          />
        ))}

        {/* Bible Progress Ring */}
        <div className="absolute inset-0 rounded-full">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="rgba(255, 215, 0, 0.2)"
              strokeWidth="2"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="rgba(255, 215, 0, 0.8)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(scrollPercentage / 100) * 226.2} 226.2`}
              style={{
                filter: isDragging ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))' : 'none'
              }}
            />
          </svg>
        </div>
      </div>

      {/* Testament Indicators */}
      <div className="absolute -top-2 -left-2 text-xs text-amber-600 font-medium">OT</div>
      <div className="absolute -bottom-2 -right-2 text-xs text-blue-600 font-medium">NT</div>
    </div>
  );
};

export default EnhancedScrollbar;