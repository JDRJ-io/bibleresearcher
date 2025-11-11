/**
 * Navigation History Popover
 * Displays a scrollable timeline of the last 50 verse visits
 */

import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HistoryEntry {
  verse_reference: string;
  translation: string;
  visited_at: string;
}

interface NavigationHistoryPopoverProps {
  history: HistoryEntry[];
  onSelectVerse: (verseRef: string) => void;
  className?: string;
}

export function NavigationHistoryPopover({
  history,
  onSelectVerse,
  className = '',
}: NavigationHistoryPopoverProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    
    return date.toLocaleDateString();
  };

  const formatVerseKey = (verseKey: string) => {
    // Convert "Gen.1:1" to "Genesis 1:1" for better readability
    const parts = verseKey.split('.');
    if (parts.length !== 2) return verseKey;
    
    const book = parts[0];
    const chapter = parts[1];
    
    // Map of common abbreviations to full names
    const bookNames: Record<string, string> = {
      'Gen': 'Genesis',
      'Exod': 'Exodus',
      'Lev': 'Leviticus',
      'Num': 'Numbers',
      'Deut': 'Deuteronomy',
      'Josh': 'Joshua',
      'Judg': 'Judges',
      'Ruth': 'Ruth',
      '1Sam': '1 Samuel',
      '2Sam': '2 Samuel',
      '1Kgs': '1 Kings',
      '2Kgs': '2 Kings',
      '1Chr': '1 Chronicles',
      '2Chr': '2 Chronicles',
      'Ezra': 'Ezra',
      'Neh': 'Nehemiah',
      'Esth': 'Esther',
      'Job': 'Job',
      'Ps': 'Psalms',
      'Prov': 'Proverbs',
      'Eccl': 'Ecclesiastes',
      'Song': 'Song of Solomon',
      'Isa': 'Isaiah',
      'Jer': 'Jeremiah',
      'Lam': 'Lamentations',
      'Ezek': 'Ezekiel',
      'Dan': 'Daniel',
      'Hos': 'Hosea',
      'Joel': 'Joel',
      'Amos': 'Amos',
      'Obad': 'Obadiah',
      'Jonah': 'Jonah',
      'Mic': 'Micah',
      'Nah': 'Nahum',
      'Hab': 'Habakkuk',
      'Zeph': 'Zephaniah',
      'Hag': 'Haggai',
      'Zech': 'Zechariah',
      'Mal': 'Malachi',
      'Matt': 'Matthew',
      'Mark': 'Mark',
      'Luke': 'Luke',
      'John': 'John',
      'Acts': 'Acts',
      'Rom': 'Romans',
      '1Cor': '1 Corinthians',
      '2Cor': '2 Corinthians',
      'Gal': 'Galatians',
      'Eph': 'Ephesians',
      'Phil': 'Philippians',
      'Col': 'Colossians',
      '1Thess': '1 Thessalonians',
      '2Thess': '2 Thessalonians',
      '1Tim': '1 Timothy',
      '2Tim': '2 Timothy',
      'Titus': 'Titus',
      'Phlm': 'Philemon',
      'Heb': 'Hebrews',
      'Jas': 'James',
      '1Pet': '1 Peter',
      '2Pet': '2 Peter',
      '1John': '1 John',
      '2John': '2 John',
      '3John': '3 John',
      'Jude': 'Jude',
      'Rev': 'Revelation',
    };
    
    const fullName = bookNames[book] || book;
    return `${fullName} ${chapter}`;
  };

  if (history.length === 0) {
    return (
      <div className={`w-64 p-4 ${className}`}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MapPin className="h-8 w-8 mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No history yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Navigate to verses to build your history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-80 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Navigation History</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {history.length} {history.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>

      {/* Scrollable History List */}
      <ScrollArea className="h-[400px]">
        <div className="p-2">
          {history.map((entry, index) => (
            <button
              key={`${entry.verse_reference}-${entry.visited_at}-${index}`}
              onClick={() => onSelectVerse(entry.verse_reference)}
              className="w-full text-left px-3 py-2.5 rounded-md hover:bg-accent/50 transition-colors group"
              data-testid={`history-entry-${index}`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Verse Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                    {formatVerseKey(entry.verse_reference)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {entry.translation}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(entry.visited_at)}
                    </div>
                  </div>
                </div>

                {/* Position Indicator */}
                <div className="flex-shrink-0 text-xs text-muted-foreground/60 font-mono mt-0.5">
                  #{history.length - index}
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground/70 text-center">
          Click any verse to jump there
        </p>
      </div>
    </div>
  );
}
