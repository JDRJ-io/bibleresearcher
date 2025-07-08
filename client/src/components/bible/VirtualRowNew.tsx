import React from 'react';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import type { BibleVerse } from '@/types/bible';

interface VirtualRowProps {
  verseID: string;
  verse: BibleVerse;
  rowHeight: number;
  columnData: any;
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  getMainVerseText: (verseID: string) => string | undefined;
  activeTranslations: string[];
  mainTranslation: string;
}

export default function VirtualRow({
  verseID,
  verse,
  rowHeight,
  columnData,
  getVerseText,
  getMainVerseText,
  activeTranslations,
  mainTranslation
}: VirtualRowProps) {
  const { alternates } = useTranslationMaps();

  const handleClick = () => {
    if (columnData?.onVerseClick) {
      columnData.onVerseClick(verseID);
    }
  };

  const getTranslationText = (translation: string) => {
    return getVerseText(verseID, translation) || 'Loading...';
  };

  const getCrossRefText = () => {
    // Mock cross-reference data for now
    return '';
  };

  const getProphecyData = (type: 'P' | 'F' | 'V') => {
    // Mock prophecy data for now
    return '';
  };

  // Build column order: Reference, alternates, main, cross-refs, prophecy
  const cells = [
    { 
      key: 'reference', 
      content: verseID, 
      type: 'reference',
      className: 'font-mono text-sm text-gray-600' 
    },
    ...alternates.map(code => ({
      key: code,
      content: getTranslationText(code),
      type: 'alternate',
      className: 'text-sm'
    })),
    {
      key: mainTranslation,
      content: getTranslationText(mainTranslation),
      type: 'main',
      className: 'text-sm font-semibold'
    },
    ...(columnData?.settings?.showCrossReferences ? [{
      key: 'cross',
      content: getCrossRefText(),
      type: 'cross',
      className: 'text-xs text-muted-foreground'
    }] : []),
    ...(columnData?.settings?.showProphecy ? [
      {
        key: 'predictions',
        content: getProphecyData('P'),
        type: 'prophecy',
        className: 'text-center text-blue-600 font-bold'
      },
      {
        key: 'fulfillments', 
        content: getProphecyData('F'),
        type: 'prophecy',
        className: 'text-center text-green-600 font-bold'
      },
      {
        key: 'verification',
        content: getProphecyData('V'),
        type: 'prophecy', 
        className: 'text-center text-purple-600 font-bold'
      }
    ] : [])
  ];

  return (
    <div 
      className="grid grid-cols-12 gap-px border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
      onClick={handleClick}
      style={{ height: rowHeight }}
      data-verse-id={verseID}
      data-testid="verse-row"
    >
      {cells.map((cell, index) => (
        <div
          key={cell.key}
          data-testid="verse-cell"
          className={`
            p-2 border-r last:border-r-0 overflow-hidden w-[120px] max-w-[300px]
            ${cell.className}
            ${cell.type === 'main' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
            ${cell.type === 'prophecy' ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''}
            ${cell.type === 'cross' ? 'bg-green-50/50 dark:bg-green-900/10' : ''}
          `}
        >
          <div className="whitespace-pre-wrap leading-snug">
            {cell.content}
          </div>
        </div>
      ))}
    </div>
  );
}