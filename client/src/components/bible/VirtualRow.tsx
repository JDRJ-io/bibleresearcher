import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { VerseData } from '@/types/bible';

interface VirtualRowProps {
  verse: VerseData;
  style: React.CSSProperties;
  onClick: (verse: VerseData) => void;
  showCrossRefs?: boolean;
  showProphecy?: boolean;
  prophecyColumns?: {
    predictions: boolean;
    fulfillments: boolean;
    verification: boolean;
  };
}

export function VirtualRow({ 
  verse, 
  style, 
  onClick,
  showCrossRefs = false,
  showProphecy = false,
  prophecyColumns = { predictions: true, fulfillments: true, verification: true }
}: VirtualRowProps) {
  const { mainTranslation, alternates } = useTranslationMaps();

  // Main translation cell gets font-semibold; alternates keep normal weight
  const getTranslationText = (translation: string) => {
    return verse.text[translation] || 'Loading...';
  };

  const getCrossRefText = () => {
    if (!verse.crossReferences || verse.crossReferences.length === 0) return '';
    
    // Show reference string + verse text (main translation) truncated
    return verse.crossReferences.slice(0, 3).map(ref => {
      const truncatedText = ref.text?.slice(0, 60) || '';
      return `${ref.ref}: ${truncatedText}...`;
    }).join(' | ');
  };

  const getProphecyData = (type: 'predictions' | 'fulfillments' | 'verification') => {
    // Mock prophecy data structure
    const prophecyData = {
      predictions: verse.prophecy?.P || [],
      fulfillments: verse.prophecy?.F || [],
      verification: verse.prophecy?.V || []
    };
    
    return prophecyData[type].length > 0 ? prophecyData[type].length : '';
  };

  const cells = [
    { 
      key: 'reference', 
      content: verse.reference, 
      type: 'reference',
      className: 'font-mono text-sm' 
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
    ...(showCrossRefs ? [{
      key: 'cross',
      content: getCrossRefText(),
      type: 'cross',
      className: 'text-xs text-muted-foreground'
    }] : []),
    ...(showProphecy && prophecyColumns.predictions ? [{
      key: 'predictions',
      content: getProphecyData('predictions'),
      type: 'prophecy',
      className: 'text-center text-blue-600 font-bold'
    }] : []),
    ...(showProphecy && prophecyColumns.fulfillments ? [{
      key: 'fulfillments', 
      content: getProphecyData('fulfillments'),
      type: 'prophecy',
      className: 'text-center text-green-600 font-bold'
    }] : []),
    ...(showProphecy && prophecyColumns.verification ? [{
      key: 'verification',
      content: getProphecyData('verification'),
      type: 'prophecy', 
      className: 'text-center text-purple-600 font-bold'
    }] : [])
  ];

  return (
    <div 
      style={style}
      className="grid grid-cols-12 gap-px border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
      onClick={() => onClick(verse)}
      data-verse-id={verse.id}
      data-verse-index={verse.index}
    >
      {cells.map((cell, index) => (
        <div
          key={cell.key}
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