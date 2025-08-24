import React from 'react';
import { BibleVerse } from '@/types/bible';
import { ColumnConfig } from '@/hooks/useColumnConfiguration';

interface ColumnContentProps {
  column: ColumnConfig;
  verses: BibleVerse[];
  rowHeight: number;
  getVerseText: (verseID: string, translationCode: string) => string;
  getMainVerseText: (verseID: string) => string;
  activeTranslations: string[];
  mainTranslation: string;
  onVerseClick?: (ref: string) => void;
  getVerseLabels?: (verseReference: string) => Record<string, string[]>;
}

// Cell Components
function ReferenceCell({ verse }: { verse: BibleVerse }) {
  return (
    <div 
      className="cell-ref flex items-center justify-center px-1 py-1 text-xs font-medium border-r"
      style={{
        color: 'var(--text-primary)',
        borderColor: 'var(--border-color)',
        height: `${36}px`, // ROW_HEIGHT
        minHeight: `${36}px`
      }}
    >
      {verse.reference}
    </div>
  );
}

function MainTranslationCell({ verse, getMainVerseText }: { verse: BibleVerse; getMainVerseText: (verseID: string) => string }) {
  const text = getMainVerseText(verse.reference);
  
  return (
    <div 
      className="px-2 py-1 text-sm border-r"
      style={{
        color: 'var(--text-primary)',
        borderColor: 'var(--border-color)',
        height: `${36}px`,
        minHeight: `${36}px`
      }}
    >
      {text || '—'}
    </div>
  );
}

function CrossReferencesCell({ verse }: { verse: BibleVerse }) {
  return (
    <div 
      className="px-2 py-1 text-sm border-r"
      style={{
        color: 'var(--text-primary)',
        borderColor: 'var(--border-color)',
        height: `${36}px`,
        minHeight: `${36}px`
      }}
    >
      {/* Cross-references content */}
      <div className="text-xs text-gray-600">Cross refs...</div>
    </div>
  );
}

function NotesCell({ verse }: { verse: BibleVerse }) {
  return (
    <div 
      className="px-2 py-1 text-sm border-r"
      style={{
        color: 'var(--text-primary)',
        borderColor: 'var(--border-color)',
        height: `${36}px`,
        minHeight: `${36}px`
      }}
    >
      {/* Notes content */}
      <div className="text-xs text-gray-600">Notes...</div>
    </div>
  );
}

function ProphecyCell({ verse, column }: { verse: BibleVerse; column: ColumnConfig }) {
  return (
    <div 
      className="px-2 py-1 text-sm border-r"
      style={{
        color: 'var(--text-primary)',
        borderColor: 'var(--border-color)',
        height: `${36}px`,
        minHeight: `${36}px`
      }}
    >
      {/* Prophecy content */}
      <div className="text-xs text-gray-600">{column.title}...</div>
    </div>
  );
}

function AlternateTranslationCell({ 
  verse, 
  column, 
  getVerseText 
}: { 
  verse: BibleVerse; 
  column: ColumnConfig; 
  getVerseText: (verseID: string, translationCode: string) => string 
}) {
  const text = column.translationCode ? getVerseText(verse.reference, column.translationCode) : '';
  
  return (
    <div 
      className="px-2 py-1 text-sm border-r"
      style={{
        color: 'var(--text-primary)',
        borderColor: 'var(--border-color)',
        height: `${36}px`,
        minHeight: `${36}px`
      }}
    >
      {text || '—'}
    </div>
  );
}

export function ColumnContent({
  column,
  verses,
  rowHeight,
  getVerseText,
  getMainVerseText,
  activeTranslations,
  mainTranslation,
  onVerseClick,
  getVerseLabels
}: ColumnContentProps) {
  
  const renderCell = (verse: BibleVerse) => {
    switch (column.type) {
      case 'reference':
        return <ReferenceCell verse={verse} />;
      case 'main-translation':
        return <MainTranslationCell verse={verse} getMainVerseText={getMainVerseText} />;
      case 'cross-refs':
        return <CrossReferencesCell verse={verse} />;
      case 'notes':
        return <NotesCell verse={verse} />;
      case 'prophecy':
        return <ProphecyCell verse={verse} column={column} />;
      case 'alt-translation':
        return <AlternateTranslationCell verse={verse} column={column} getVerseText={getVerseText} />;
      default:
        return <div>Unknown column type</div>;
    }
  };

  return (
    <div className="column-content">
      {verses.map((verse) => (
        <div key={verse.id}>
          {renderCell(verse)}
        </div>
      ))}
    </div>
  );
}