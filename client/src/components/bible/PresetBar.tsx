import { Button } from '@/components/ui/button';
import { StickyNote, Link, Sparkles, Layers, BookOpen } from 'lucide-react';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from '@/store/translationSlice';
import { CustomPresetsDropdown } from './CustomPresetsDropdown';

const AVAILABLE_TRANSLATIONS = ["KJV", "BSB", "WEB", "YLT"];

export function PresetBar() {
  const { 
    showNotes, 
    showCrossRefs, 
    showProphecies,
    showHybrid,
    toggleNotes, 
    toggleCrossRefs, 
    toggleProphecies,
    toggleHybrid
  } = useBibleStore();
  
  const { main, alternates, toggleAlternate } = useTranslationMaps();

  const applyNotesPreset = () => {
    if (!showNotes) toggleNotes();
    if (showCrossRefs) toggleCrossRefs();
    if (showProphecies) toggleProphecies();
    if (showHybrid) toggleHybrid();
    
    const currentAlternates = [...alternates];
    currentAlternates.forEach(altId => {
      toggleAlternate(altId);
    });
  };

  const applyCrossPreset = () => {
    if (showNotes) toggleNotes();
    if (!showCrossRefs) toggleCrossRefs();
    if (showProphecies) toggleProphecies();
    if (showHybrid) toggleHybrid();
    
    const currentAlternates = [...alternates];
    currentAlternates.forEach(altId => {
      toggleAlternate(altId);
    });
  };

  const applyProphecyPreset = () => {
    // Turn off Notes if they're on
    if (showNotes) toggleNotes();
    
    // Turn off Cross Refs if they're on
    if (showCrossRefs) toggleCrossRefs();
    
    // Turn on Prophecies if they're off
    if (!showProphecies) toggleProphecies();
    
    // Turn off Master Column if it's on
    if (showHybrid) toggleHybrid();
    
    // Clear all alternate translations
    const currentAlternates = [...alternates];
    currentAlternates.forEach(altId => {
      toggleAlternate(altId);
    });
  };

  const applyAlternatePreset = () => {
    // Turn off Notes, Cross Refs, Prophecies, and Master Column
    if (showNotes) toggleNotes();
    if (showCrossRefs) toggleCrossRefs();
    if (showProphecies) toggleProphecies();
    if (showHybrid) toggleHybrid();
    
    // Get all translations except the main one
    const translationsToToggleOn = AVAILABLE_TRANSLATIONS.filter(
      tr => tr !== main
    );
    
    // Clear all current alternates first
    const currentAlternates = [...alternates];
    currentAlternates.forEach(altId => {
      toggleAlternate(altId);
    });
    
    // Toggle on all translations that aren't the main one
    translationsToToggleOn.forEach(translationId => {
      toggleAlternate(translationId);
    });
  };

  const applyMasterPreset = () => {
    // Turn off Notes, Cross Refs, and Prophecies
    if (showNotes) toggleNotes();
    if (showCrossRefs) toggleCrossRefs();
    if (showProphecies) toggleProphecies();
    
    // Turn on Master Column if it's off
    if (!showHybrid) toggleHybrid();
    
    // Clear all alternate translations
    const currentAlternates = [...alternates];
    currentAlternates.forEach(altId => {
      toggleAlternate(altId);
    });
  };

  return (
    <div className="flex items-center gap-1 md:gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-400 mr-1 md:hidden font-medium">
        Presets
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={applyNotesPreset}
        className="h-8 w-8 md:w-auto px-0 md:px-3 text-sm rounded-full bg-transparent hover:bg-gray-200/50 text-gray-600 hover:text-gray-900 dark:hover:bg-gray-700/30 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        data-testid="button-preset-notes"
        aria-label="Notes preset"
        title="Notes preset"
      >
        <StickyNote className="w-4 h-4" />
        <span className="hidden md:inline ml-2">Notes</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={applyCrossPreset}
        className="h-8 w-8 md:w-auto px-0 md:px-3 text-sm rounded-full bg-transparent hover:bg-gray-200/50 text-gray-600 hover:text-gray-900 dark:hover:bg-gray-700/30 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        data-testid="button-preset-cross"
        aria-label="Cross References preset"
        title="Cross References preset"
      >
        <Link className="w-4 h-4" />
        <span className="hidden md:inline ml-2">Cross</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={applyProphecyPreset}
        className="h-8 w-8 md:w-auto px-0 md:px-3 text-sm rounded-full bg-transparent hover:bg-gray-200/50 text-gray-600 hover:text-gray-900 dark:hover:bg-gray-700/30 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        data-testid="button-preset-prophecy"
        aria-label="Prophecy preset"
        title="Prophecy preset"
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden md:inline ml-2">Prophecy</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={applyAlternatePreset}
        className="h-8 w-8 md:w-auto px-0 md:px-3 text-sm rounded-full bg-transparent hover:bg-gray-200/50 text-gray-600 hover:text-gray-900 dark:hover:bg-gray-700/30 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        data-testid="button-preset-alternate"
        aria-label="Alternate Translations preset"
        title="Alternate Translations preset"
      >
        <Layers className="w-4 h-4" />
        <span className="hidden md:inline ml-2">Alternate</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={applyMasterPreset}
        className="h-8 w-8 md:w-auto px-0 md:px-3 text-sm rounded-full bg-transparent hover:bg-gray-200/50 text-gray-600 hover:text-gray-900 dark:hover:bg-gray-700/30 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        data-testid="button-preset-master"
        aria-label="Master Column preset"
        title="Master Column preset"
      >
        <BookOpen className="w-4 h-4" />
        <span className="hidden md:inline ml-2">Master</span>
      </Button>
      
      <CustomPresetsDropdown />
    </div>
  );
}
