import type { BibleVerse, Translation, UserNote, Highlight } from '@/types/bible';
import { ProphecyColumns } from './ProphecyColumns';
import { useBibleStore } from '@/App';

interface VerseRowProps {
  verse: BibleVerse;
  verseIndex: number;
  selectedTranslations: Translation[];
  showNotes: boolean;
  showProphecy: boolean;
  showContext: boolean;
  userNote?: UserNote;
  highlights: Highlight[];
  onExpandVerse: (verse: BibleVerse) => void;
  onHighlight: (verseRef: string, selection: Selection) => void;
  onNavigateToVerse: (reference: string) => void;
  getProphecyDataForVerse?: (verseKey: string) => any[];
  getGlobalVerseText?: (reference: string) => string;
  allVerses: BibleVerse[]; // Add verses for text lookup
}

export function VerseRow({
  verse,
  verseIndex,
  selectedTranslations,
  showNotes,
  showProphecy,
  showContext,
  userNote,
  highlights,
  onExpandVerse,
  onHighlight,
  onNavigateToVerse,
  getProphecyDataForVerse,
  getGlobalVerseText,
  allVerses,
}: VerseRowProps) {
  const { store } = useBibleStore();
  
  // Create preferences object for consistency
  const preferences = {
    showNotes,
    showProphecy,
    showContext,
  };

  const handleDoubleClick = () => {
    onExpandVerse(verse);
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      onHighlight(verse.reference, selection);
    }
  };

  return (
    <div 
      id={`verse-${verse.id}`}
      data-verse-ref={verse.reference}
      data-verse-index={verseIndex}
      className="verse-row flex min-w-full border-b transition-colors duration-200 cursor-pointer"
      style={{ height: '120px' }}
      onDoubleClick={handleDoubleClick}
      onMouseUp={handleMouseUp}
    >
      {/* Reference Column - Fixed Width with vertical text */}
      <div className="w-12 flex-shrink-0 flex items-center justify-center border-r px-1 text-xs font-medium">
        <span className="transform -rotate-90 whitespace-nowrap origin-center text-center">
          {verse.reference}
        </span>
      </div>

      {/* Translation Text Columns - Dynamic based on selected translations */}
      {selectedTranslations.map((translation) => (
        <div key={translation.id} className="w-80 flex-shrink-0 border-r">
          <div className="h-[120px] overflow-y-auto p-3 text-sm">
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {verse.text[translation.id] || (
                <span className="text-muted-foreground italic">
                  [{verse.reference} - {translation.abbreviation} loading...]
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Cross References Column - Fixed Width */}
      <div className="w-60 flex-shrink-0 border-r">
        <div className="h-[120px] overflow-y-auto p-3 text-xs">
          {/* Cross-reference badge */}
          <div className="flex items-center gap-2 mb-2">
            {store.crossRefs[verse.reference]?.length > 0 && (
              <span className="text-sky-500 text-xs cursor-pointer" aria-label={`${store.crossRefs[verse.reference].length} cross references`}>
                📖 {store.crossRefs[verse.reference].length}
              </span>
            )}
          </div>
          
          {verse.crossReferences && verse.crossReferences.length > 0 ? (
            verse.crossReferences.map((ref, index) => (
              <div key={index} className="mb-2">
                <button 
                  onClick={() => onNavigateToVerse(ref.reference)}
                  className="cross-ref-button font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  {ref.reference}
                </button>
                <div className="text-muted-foreground break-words mt-1">{ref.text}</div>
              </div>
            ))
          ) : (
            <span className="text-muted-foreground italic">No cross references</span>
          )}
        </div>
      </div>

      {/* Prophecy Columns - New System */}
      {showProphecy && (
        <div className="w-[480px] flex-shrink-0 border-r">
          <ProphecyColumns verseIDs={[verse.reference]} />
        </div>
      )}
      
      {/* Notes Column */}
      {showNotes && (
        <div className="w-60 flex-shrink-0 border-r">
          <div className="h-[120px] overflow-y-auto p-3 text-xs">
            {userNote ? (
              <div className="whitespace-pre-wrap break-words">{userNote.note}</div>
            ) : (
              <span className="text-muted-foreground italic">Add notes...</span>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
