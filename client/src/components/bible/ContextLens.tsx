import { createPortal } from 'react-dom';
import { useLayoutStore } from '@/store/useLayoutStore';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBibleStore } from '@/App';
import { loadTranslation } from '@/data/BibleDataAPI';
import { memo, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContextLens() {
  const { panelOpen, panelVerse, closePanel } = useLayoutStore((s) => ({
    panelOpen: s.panelOpen,
    panelVerse: s.panelVerse,
    closePanel: s.closePanel,
  }));
  
  if (!panelOpen || !panelVerse) return null;

  return createPortal(
    <aside
      className="fixed right-0 top-0 h-full w-full lg:w-[480px] bg-background border-l shadow-xl
                 transition-transform duration-200 z-50"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{panelVerse}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={closePanel}
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-4rem)]">
        <PanelContent verseKey={panelVerse} />
      </ScrollArea>
    </aside>,
    document.body
  );
}

const PanelContent = memo(({ verseKey }: { verseKey: string }) => {
  const { 
    translations, 
    translationState, 
    crossRefs, 
    showNotes, 
    showDates,
    prophecyData,
    prophecyIndex,
    datesData
  } = useBibleStore();
  
  const mainTranslation = translationState.main;
  const alternates = translationState.alternates;
  
  // Get main translation verse
  const mainVerse = translations[mainTranslation]?.verses?.[verseKey];
  
  // Get cross references
  const crossReferences = crossRefs[verseKey] || [];
  
  // Get prophecy data
  const prophecyInfo = prophecyData[verseKey];
  
  // Get date info
  const verseIndex = Object.keys(translations[mainTranslation]?.verses || {}).indexOf(verseKey);
  const dateInfo = datesData?.[verseIndex];
  
  return (
    <div className="p-4 space-y-6">
      {/* Main Translation */}
      <Section title={`${mainTranslation} Translation`}>
        <p className="text-sm leading-relaxed">{mainVerse || 'Loading...'}</p>
      </Section>
      
      {/* Alternate Translations */}
      {alternates.length > 0 && (
        <Section title="Alternate Translations">
          <div className="space-y-3">
            {alternates.map((translationCode) => (
              <AlternateTranslation 
                key={translationCode} 
                translationCode={translationCode} 
                verseKey={verseKey} 
              />
            ))}
          </div>
        </Section>
      )}
      
      {/* Dates */}
      {showDates && dateInfo && (
        <Section title="Date">
          <p className="text-sm">{dateInfo}</p>
        </Section>
      )}
      
      {/* Cross References */}
      {crossReferences.length > 0 && (
        <Section title="Cross References">
          <div className="flex flex-wrap gap-2">
            {crossReferences.map((ref, index) => (
              <button
                key={index}
                className="text-xs px-2 py-1 bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                onClick={() => {
                  // Navigate to cross reference
                  const event = new CustomEvent('navigateToVerse', { detail: ref });
                  window.dispatchEvent(event);
                }}
              >
                {ref}
              </button>
            ))}
          </div>
        </Section>
      )}
      
      {/* Prophecy Connections */}
      {prophecyInfo && (
        <>
          {prophecyInfo.P?.length > 0 && (
            <Section title="Predictions">
              <ProphecyList prophecyIds={prophecyInfo.P} type="prediction" />
            </Section>
          )}
          {prophecyInfo.F?.length > 0 && (
            <Section title="Fulfillments">
              <ProphecyList prophecyIds={prophecyInfo.F} type="fulfillment" />
            </Section>
          )}
          {prophecyInfo.V?.length > 0 && (
            <Section title="Verifications">
              <ProphecyList prophecyIds={prophecyInfo.V} type="verification" />
            </Section>
          )}
        </>
      )}
    </div>
  );
});

PanelContent.displayName = 'PanelContent';

function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground">{title}</h3>
      <div className="pl-2">{children}</div>
    </div>
  );
}

function AlternateTranslation({ translationCode, verseKey }: { translationCode: string; verseKey: string }) {
  const { translations } = useBibleStore();
  const [verseText, setVerseText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadVerse = async () => {
      setIsLoading(true);
      try {
        // First check if translation is already in store
        if (translations[translationCode]?.verses?.[verseKey]) {
          setVerseText(translations[translationCode].verses[verseKey]);
        } else {
          // Load the translation
          const translationMap = await loadTranslation(translationCode);
          const text = translationMap.get(verseKey);
          setVerseText(text || 'Verse not found');
        }
      } catch (error) {
        console.error(`Error loading ${translationCode} verse:`, error);
        setVerseText('Error loading verse');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVerse();
  }, [translationCode, verseKey, translations]);
  
  if (isLoading) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium">{translationCode}</p>
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{translationCode}</p>
      <p className="text-sm leading-relaxed">{verseText}</p>
    </div>
  );
}

function ProphecyList({ prophecyIds, type }: { prophecyIds: number[]; type: 'prediction' | 'fulfillment' | 'verification' }) {
  const { prophecyIndex } = useBibleStore();
  
  return (
    <div className="space-y-2">
      {prophecyIds.map((id) => {
        const prophecy = prophecyIndex[id];
        if (!prophecy) return null;
        
        const content = type === 'prediction' ? prophecy.prophecy :
                       type === 'fulfillment' ? prophecy.fulfillment :
                       prophecy.verification;
        
        return (
          <div key={id} className="text-sm space-y-1 p-2 bg-secondary/50 rounded-md">
            <p className="font-medium text-xs">#{id}: {prophecy.summary}</p>
            {content.map((verse, index) => (
              <p key={index} className="text-xs pl-2">{verse}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
}