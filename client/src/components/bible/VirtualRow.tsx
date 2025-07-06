import React from 'react';
import { BibleVerse } from '../../types/bible';

interface VirtualRowProps {
  verseID: string;
  rowHeight: number;
  verse: BibleVerse;
  columnData: any;
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  getMainVerseText: (verseID: string) => string | undefined;
  activeTranslations: string[];
  mainTranslation: string;
}

/**
 * Reusable component that renders one verse row with translation maps integration.
 * Accepts props verseID, rowHeight, and columnData.
 */
export function VirtualRow({ verseID, rowHeight, verse, columnData, getVerseText, getMainVerseText, activeTranslations, mainTranslation }: VirtualRowProps) {
  // Guard against undefined verse data
  if (!verse) {
    return (
      <div 
        className="virtual-row border-b border-gray-200 dark:border-gray-700 flex"
        style={{ height: rowHeight }}
        data-verse-id={verseID}
      >
        <div className="w-20 px-1 py-1 text-xs">Loading...</div>
      </div>
    );
  }

  const { translations, crossReferences, prophecyData, settings } = columnData;
  
  return (
    <div 
      className="virtual-row border-b border-gray-200 dark:border-gray-700 flex"
      style={{ height: rowHeight }}
      data-verse-id={verseID}
      data-verse-index={verse.index}
    >
      {/* Verse Reference Column - Tighter */}
      <div className="w-20 px-1 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
        {verse.reference}
      </div>
      
      {/* Main Translation Column - Tighter */}
      <div className="w-80 px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="overflow-auto h-full">
          {getMainVerseText(verseID) || `Loading ${verse.reference}...`}
        </div>
      </div>
      
      {/* Multi-Translation Columns - Tighter */}
      {activeTranslations.slice(1).map((translation: string) => (
        <div key={translation} className="w-80 px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="overflow-auto h-full">
            {getVerseText(verseID, translation) || `Loading ${verse.reference}...`}
          </div>
        </div>
      ))}
      
      {/* Cross-References Column - Tighter */}
      {settings.showCrossReferences && (
        <div className="w-60 px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="overflow-auto h-full">
            {verse.crossReferences.slice(0, 6).map((ref, index) => (
              <span key={index} className="inline-block mr-1 mb-1 text-xs">
                <button 
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  onClick={() => columnData.onVerseClick?.(ref.reference)}
                >
                  {ref.reference}
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Prophecy Columns - Tighter */}
      {settings.showProphecy && (
        <>
          <div className="w-16 px-1 py-1 text-xs border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="overflow-auto h-full text-blue-600 dark:text-blue-400">
              {/* Predictions */}
              {prophecyData?.[verseID]?.predictions?.length > 0 && (
                <span className="text-xs">P: {prophecyData[verseID].predictions.length}</span>
              )}
            </div>
          </div>
          <div className="w-16 px-1 py-1 text-xs border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="overflow-auto h-full text-green-600 dark:text-green-400">
              {/* Fulfillments */}
              {prophecyData?.[verseID]?.fulfillments?.length > 0 && (
                <span className="text-xs">F: {prophecyData[verseID].fulfillments.length}</span>
              )}
            </div>
          </div>
          <div className="w-16 px-1 py-1 text-xs border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="overflow-auto h-full text-purple-600 dark:text-purple-400">
              {/* Verifications */}
              {prophecyData?.[verseID]?.verifications?.length > 0 && (
                <span className="text-xs">V: {prophecyData[verseID].verifications.length}</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}