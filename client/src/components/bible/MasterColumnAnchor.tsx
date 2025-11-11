import { useBibleStore } from '@/App';
import { MasterColumnPanel } from './MasterColumnPanel';
import { useTranslationMaps } from '@/store/translationSlice';

interface MasterColumnAnchorProps {
  anchorVerseRef: string;
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  onVerseClick?: (verseRef: string) => void;
}

export function MasterColumnAnchor({ anchorVerseRef, getVerseText, onVerseClick }: MasterColumnAnchorProps) {
  const store = useBibleStore();
  const { main: mainTranslation, alternates } = useTranslationMaps();
  const { crossRefs, prophecyData, showHybrid } = store;

  if (!showHybrid) {
    return null;
  }

  const verseCrossRefs = crossRefs[anchorVerseRef]?.data || [];
  const prophecyRoles = prophecyData?.[anchorVerseRef];
  
  // TODO: Fetch strongsWords data for anchor verse
  const strongsWords: any[] = [];

  return (
    <div 
      className="master-column-anchor fixed top-0 right-0 bottom-0 bg-background border-l border-gray-200 dark:border-gray-700 overflow-y-auto"
      style={{ 
        width: 'calc(384px * var(--column-width-mult, 1))',
        zIndex: 20,
        paddingTop: 'calc(var(--top-header-total-height, 138px))',
        paddingBottom: 'var(--footer-height, 50px)'
      }}
    >
      <MasterColumnPanel
        verseRef={anchorVerseRef}
        getVerseText={getVerseText}
        mainTranslation={mainTranslation}
        alternateTranslations={alternates}
        onVerseClick={onVerseClick}
        crossRefs={verseCrossRefs}
        strongsWords={strongsWords}
        prophecyRoles={prophecyRoles}
      />
    </div>
  );
}
