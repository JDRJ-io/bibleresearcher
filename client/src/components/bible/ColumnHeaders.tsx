import type { Translation } from '@/types/bible';

interface ColumnHeadersProps {
  selectedTranslations: Translation[];
  showNotes: boolean;
  showProphecy: boolean;
}

export function ColumnHeaders({ selectedTranslations, showNotes, showProphecy }: ColumnHeadersProps) {
  const activeTranslations = selectedTranslations.filter(t => t.selected);
  
  return (
    <div className="flex min-w-max bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ height: '48px' }}>
      {/* Reference Column Header */}
      <div className="w-24 flex-shrink-0 flex items-center justify-center border-r border-gray-200 dark:border-gray-700 px-2 font-semibold text-sm bg-gray-100 dark:bg-gray-700">
        Reference
      </div>

      {/* KJV Header */}
      <div className="w-80 flex-shrink-0 flex items-center px-3 border-r border-gray-200 dark:border-gray-700 font-semibold text-sm bg-gray-100 dark:bg-gray-700">
        KJV - King James Version
      </div>

      {/* Cross References Header */}
      <div className="w-60 flex-shrink-0 flex items-center px-3 border-r border-gray-200 dark:border-gray-700 font-semibold text-sm bg-gray-100 dark:bg-gray-700">
        Cross References
      </div>

      {/* Strong's Header */}
      <div className="w-60 flex-shrink-0 flex items-center px-3 border-r border-gray-200 dark:border-gray-700 font-semibold text-sm bg-gray-100 dark:bg-gray-700">
        Strong's Concordance
      </div>

      {/* Additional Translation Headers */}
      {activeTranslations.filter(t => t.id !== 'KJV').map(translation => (
        <div key={translation.id} className="w-80 flex-shrink-0 flex items-center px-3 border-r border-gray-200 dark:border-gray-700 font-semibold text-sm bg-gray-100 dark:bg-gray-700">
          {translation.abbreviation} - {translation.name}
        </div>
      ))}
      
      {/* Notes Header */}
      {showNotes && (
        <div className="w-60 flex-shrink-0 flex items-center px-3 border-r border-gray-200 dark:border-gray-700 font-semibold text-sm bg-gray-100 dark:bg-gray-700">
          Personal Notes
        </div>
      )}
      
      {/* Prophecy Header */}
      {showProphecy && (
        <div className="w-60 flex-shrink-0 flex items-center px-3 border-r border-gray-200 dark:border-gray-700 font-semibold text-sm bg-gray-100 dark:bg-gray-700">
          Prophecy & Fulfillment
        </div>
      )}
    </div>
  );
}
