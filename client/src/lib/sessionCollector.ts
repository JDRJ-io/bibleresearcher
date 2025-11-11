import { useBibleStore } from '@/App';

export function getCurrentVerseKey(): string {
  // Try to get from URL hash first (e.g., #John.3:16)
  const hash = window.location.hash.slice(1);
  if (hash && hash.includes('.')) {
    // Normalize hash format: convert Book.Chapter.Verse to Book.Chapter:Verse
    // Match pattern like "John.3.16" or "1John.3.16" or "Gen.1.1"
    const normalizedHash = hash.replace(/^([^.]+\.\d+)\.(\d+)/, '$1:$2');
    // Validate it has the correct format Book.Chapter:Verse
    if (normalizedHash.match(/^[^.]+\.\d+:\d+$/)) {
      return normalizedHash;
    }
  }
  
  // Fallback to store's current verse keys
  const state = useBibleStore.getState();
  if (state.currentVerseKeys && state.currentVerseKeys.length > 0) {
    return state.currentVerseKeys[0];
  }
  
  // Default to Genesis 1:1
  return 'Gen.1:1';
}

export function collectAllMenuToggles(): any {
  const state = useBibleStore.getState();
  
  // Get theme from localStorage
  let theme = 'light';
  try {
    theme = localStorage.getItem('theme') || 'light';
  } catch (e) {
    // Fallback to light
  }
  
  return {
    // Toggle states
    showNotes: state.showNotes,
    showCrossRefs: state.showCrossRefs,
    showProphecies: state.showProphecies,
    showDates: state.showDates,
    showContext: state.showContext,
    showHybrid: state.showHybrid,
    isChronological: state.isChronological,
    unlockMode: state.unlockMode,
    
    // Translation states
    mainTranslation: state.translationState.main,
    alternateTranslations: state.translationState.alternates,
    translation: state.translationState.main, // Alias for database RPC
    
    // Label states
    activeLabels: state.activeLabels,
    
    // Alignment lock mode
    alignmentLockMode: state.alignmentLockMode,
    
    // Size states
    sizeMult: state.sizeState.sizeMult,
    textSizeMult: state.sizeState.textSizeMult,
    externalSizeMult: state.sizeState.externalSizeMult,
    unifiedSizing: state.sizeState.unifiedSizing,
    
    // Theme
    theme,
    
    // Scroll position (current anchor verse index)
    scrollIndex: state.anchorVerseIndex || 0,
    
    // Column display order - save as array of slot numbers in display order
    columnDisplayOrder: state.columnState.columns
      .filter(c => c.visible)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(c => c.slot)
  };
}

export function collectSessionState(): any {
  const currentVerseKey = getCurrentVerseKey();
  const toggles = collectAllMenuToggles();
  
  return {
    last_verse_key: currentVerseKey,
    last_toggles: toggles
  };
}
