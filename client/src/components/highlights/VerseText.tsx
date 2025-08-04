import React from 'react';
import { useVerseHighlights } from '@/hooks/useVerseHighlights';

interface Props {
  verseRef: string;
  translation: string;
  text: string;
}

export function VerseText({ verseRef, translation, text }: Props) {
  const { data: highlights = [] } = useVerseHighlights(verseRef, translation);

  if (!highlights.length) return <>{text}</>;

  // Sort highlights by start_pos
  const sortedHighlights = highlights.sort((a, b) => a.start_pos - b.start_pos);

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  
  sortedHighlights.forEach((h, index) => {
    // Add non-highlighted text before this highlight
    if (cursor < h.start_pos) {
      parts.push(text.slice(cursor, h.start_pos));
    }
    
    // Add highlighted text
    parts.push(
      <span key={`highlight-${h.id}-${index}`} style={{ background: `hsl(${h.color_hsl})` }}>
        {text.slice(h.start_pos, h.end_pos)}
      </span>
    );
    
    cursor = h.end_pos;
  });
  
  // Add remaining text after last highlight
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  
  return <>{parts}</>;
}