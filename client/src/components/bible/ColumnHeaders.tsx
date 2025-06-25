import { Hash, BookOpen, Link, Gem, CheckCircle, IdCard, StickyNote } from 'lucide-react';
import type { Translation } from '@/types/bible';

interface ColumnHeadersProps {
  selectedTranslations: Translation[];
  showNotes: boolean;
  showProphecy: boolean;
}

export function ColumnHeaders({ selectedTranslations, showNotes, showProphecy }: ColumnHeadersProps) {
  return (
    <div
      className="sticky z-20 border-b flex min-w-max"
      style={{
        backgroundColor: 'var(--column-bg)',
        borderColor: 'var(--border-color)',
        top: 'var(--header-height)',
      }}
    >
      {/* Notes Column Header (when enabled) */}
      {showNotes && (
        <div className="w-48 px-4 py-3 border-r font-semibold text-sm flex items-center justify-center">
          <StickyNote className="w-4 h-4 mr-2" style={{ color: 'var(--accent-color)' }} />
          Notes
        </div>
      )}

      {/* Index Column Header */}
      <div className="w-24 px-4 py-3 border-r font-semibold text-sm flex items-center justify-center">
        <Hash className="w-4 h-4 mr-2" style={{ color: 'var(--accent-color)' }} />
        Ref
      </div>

      {/* Verse Column Headers (dynamic based on selected translations) */}
      {selectedTranslations.filter(t => t.selected).map((translation) => (
        <div
          key={translation.id}
          className="flex-1 min-w-96 px-4 py-3 border-r font-semibold text-sm flex items-center justify-center"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <BookOpen className="w-4 h-4 mr-2" style={{ color: 'var(--accent-color)' }} />
          {translation.abbreviation}
        </div>
      ))}

      {/* Cross References Header */}
      <div className="w-80 px-4 py-3 border-r font-semibold text-sm flex items-center justify-center">
        <Link className="w-4 h-4 mr-2" style={{ color: 'var(--accent-color)' }} />
        Cross Refs
      </div>

      {/* Prophecy Headers (when enabled) */}
      {showProphecy && (
        <>
          <div className="w-64 px-4 py-3 border-r font-semibold text-sm flex items-center justify-center">
            <Gem className="w-4 h-4 mr-2" style={{ color: 'var(--accent-color)' }} />
            Predictions
          </div>
          <div className="w-64 px-4 py-3 border-r font-semibold text-sm flex items-center justify-center">
            <CheckCircle className="w-4 h-4 mr-2" style={{ color: 'var(--accent-color)' }} />
            Fulfillments
          </div>
          <div className="w-64 px-4 py-3 font-semibold text-sm flex items-center justify-center">
            <IdCard className="w-4 h-4 mr-2" style={{ color: 'var(--accent-color)' }} />
            Verifications
          </div>
        </>
      )}
    </div>
  );
}
