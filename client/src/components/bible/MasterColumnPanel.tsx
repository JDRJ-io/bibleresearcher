import React from 'react';
import { useBibleStore } from '@/App';
import { getVerseKeys } from '@/lib/verseKeysLoader';
import { HybridCell } from './HybridCell';

interface MasterColumnPanelProps {
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  mainTranslation: string;
  onVerseClick?: (verseRef: string) => void;
  getVerseLabels?: (verseReference: string) => Record<string, string[]>;
  currentVerse?: { reference: string; index: number };
}

export function MasterColumnPanel({ 
  getVerseText, 
  mainTranslation, 
  onVerseClick, 
  getVerseLabels,
  currentVerse
}: MasterColumnPanelProps) {
  const store = useBibleStore();
  const { showHybrid } = store;

  if (!showHybrid) {
    return null;
  }

  // Use the current verse being tracked, fallback to Genesis 1:1
  const centerVerseRef = currentVerse?.reference || 'Gen.1:1';

  return (
    <div className="fixed top-20 right-4 w-80 max-h-[calc(100vh-120px)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
          Master Column
        </h3>
        <p className="text-xs text-blue-600 dark:text-blue-300">
          Center verse context
        </p>
      </div>
      
      {/* Content */}
      <div className="h-full overflow-y-auto">
        <HybridCell 
          centerVerseRef={centerVerseRef}
          getVerseText={getVerseText}
          mainTranslation={mainTranslation}
          onVerseClick={onVerseClick}
          getVerseLabels={getVerseLabels}
        />
      </div>
    </div>
  );
}