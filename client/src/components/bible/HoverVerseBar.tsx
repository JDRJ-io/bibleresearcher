import { useState, useEffect } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Book, Copy, Bookmark, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BibleVerse } from '@/types/bible';

interface HoverVerseBarProps {
  verse: BibleVerse;
  children: React.ReactNode;
  translation?: string;
  onBookmark?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
  wrapperClassName?: string;
}

export function HoverVerseBar({ 
  verse, 
  children, 
  translation = 'KJV',
  onBookmark, 
  onCopy, 
  onShare,
  wrapperClassName = ''
}: HoverVerseBarProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    } else {
      // Default copy behavior with translation
      const verseText = Object.values(verse.text)[0];
      const text = `${verse.reference} (${translation}) - ${verseText}`;
      navigator.clipboard.writeText(text);
    }
  };

  const handleBookmark = () => {
    if (onBookmark) {
      onBookmark();
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      // Default share behavior with translation
      const verseText = Object.values(verse.text)[0];
      const text = `${verse.reference} (${translation}) - ${verseText}`;
      if (navigator.share) {
        navigator.share({
          title: `${verse.reference} (${translation})`,
          text: text,
        });
      } else {
        handleCopy();
      }
    }
  };

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative ${wrapperClassName}`}
        >
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-auto p-2 bg-background border shadow-lg"
        side="top"
        align="start"
      >
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Book className="w-3 h-3" />
            {verse.reference}
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={handleCopy}
              title="Copy verse"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={handleBookmark}
              title="Bookmark verse"
            >
              <Bookmark className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={handleShare}
              title="Share verse"
            >
              <Share2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}