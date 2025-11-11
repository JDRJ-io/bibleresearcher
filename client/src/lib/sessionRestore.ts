import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';
import { useBibleStore } from '@/App';
import { validatePresetData } from './presetSchema';

export interface SessionState {
  last_verse_key: string;
  last_toggles: any; // JSON object with all toggle states
}

// Load session state from Supabase
export async function loadSessionState(userId: string): Promise<SessionState | null> {
  try {
    const { data, error } = await supabase()
      .from('user_sessions')
      .select('last_verse_position, session_data')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // User might not have a session state yet (first login)
      if (error.code === 'PGRST116') {
        logger.debug('SESSION', 'no-state-found');
        return null;
      }
      logger.error('SESSION', 'load-failed', { error });
      return null;
    }
    
    // Parse session_data from JSON string
    let toggles = {};
    if (data.session_data) {
      try {
        toggles = typeof data.session_data === 'string' 
          ? JSON.parse(data.session_data) 
          : data.session_data;
      } catch (e) {
        logger.warn('SESSION', 'parse-failed', { error: e });
      }
    }
    
    const sessionState: SessionState = {
      last_verse_key: data.last_verse_position || 'Gen.1:1',
      last_toggles: toggles
    };
    
    logger.info('SESSION', 'loaded', { verseKey: sessionState.last_verse_key, toggleCount: Object.keys(toggles).length });
    return sessionState;
  } catch (error) {
    logger.error('SESSION', 'load-exception', { error });
    return null;
  }
}

// Restore session state to store
export function restoreSessionState(
  sessionState: SessionState | any, 
  navigateToVerse?: (verseKey: string) => void
) {
  try {
    const store = useBibleStore.getState();
    
    // Validate preset data using Zod schema
    const toggles = validatePresetData(sessionState.last_toggles || sessionState);
    
    if (!toggles || Object.keys(toggles).length === 0) {
      logger.warn('SESSION', 'no-valid-data-to-restore');
      return;
    }
    
    logger.debug('SESSION', 'restoring-validated-data', { toggles });
    
    // Restore toggle states
    if (typeof toggles.showNotes === 'boolean' && toggles.showNotes !== store.showNotes) {
      store.toggleNotes();
    }
    if (typeof toggles.showCrossRefs === 'boolean' && toggles.showCrossRefs !== store.showCrossRefs) {
      store.toggleCrossRefs();
    }
    if (typeof toggles.showProphecies === 'boolean' && toggles.showProphecies !== store.showProphecies) {
      store.toggleProphecies();
    }
    if (typeof toggles.showDates === 'boolean' && toggles.showDates !== store.showDates) {
      store.toggleDates();
    }
    if (typeof toggles.showContext === 'boolean' && toggles.showContext !== store.showContext) {
      store.toggleContext();
    }
    if (typeof toggles.showHybrid === 'boolean' && toggles.showHybrid !== store.showHybrid) {
      store.toggleHybrid();
    }
    if (typeof toggles.isChronological === 'boolean' && toggles.isChronological !== store.isChronological) {
      store.toggleChronological();
    }
    if (typeof toggles.unlockMode === 'boolean' && toggles.unlockMode !== store.unlockMode) {
      store.toggleUnlockMode();
    }
    
    // Restore translation states
    if (typeof toggles.mainTranslation === 'string' && toggles.mainTranslation !== store.translationState.main) {
      store.translationState.setMain(toggles.mainTranslation);
    }
    if (Array.isArray(toggles.alternateTranslations)) {
      // Clear current alternates and set new ones
      store.translationState.clearAlternates('');
      toggles.alternateTranslations.forEach((alt: string) => {
        store.translationState.toggleAlternate(alt);
      });
    }
    
    // Restore active labels
    if (Array.isArray(toggles.activeLabels)) {
      // Type assertion - we trust the data from the database
      store.setActiveLabels(toggles.activeLabels as any);
    }
    
    // Restore size states
    if (typeof toggles.sizeMult === 'number') {
      store.sizeState.setSizeMult(toggles.sizeMult);
    }
    if (typeof toggles.textSizeMult === 'number') {
      store.sizeState.setTextSizeMult(toggles.textSizeMult);
    }
    if (typeof toggles.externalSizeMult === 'number') {
      store.sizeState.setExternalSizeMult(toggles.externalSizeMult);
    }
    if (typeof toggles.unifiedSizing === 'boolean' && toggles.unifiedSizing !== store.sizeState.unifiedSizing) {
      store.sizeState.toggleUnifiedSizing();
    }
    
    // Restore theme
    if (typeof toggles.theme === 'string') {
      try {
        localStorage.setItem('theme', toggles.theme);
        // Trigger theme change event
        window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: toggles.theme } }));
      } catch (e) {
        logger.warn('SESSION', 'theme-restore-failed');
      }
    }
    
    // Restore column display order
    if (Array.isArray(toggles.columnDisplayOrder)) {
      logger.info('SESSION', 'restoring-column-order', { order: toggles.columnDisplayOrder });
      // Type assertion - setColumnDisplayOrder accepts number[] in implementation
      store.columnState.setColumnDisplayOrder(toggles.columnDisplayOrder as any);
    }
    
    // Restore alignment lock mode (respecting device type)
    // Mobile devices: Always use leftLocked, ignore saved state
    // Desktop devices: Restore saved state (but filter out leftLocked since that's mobile-only)
    const isMobile = window.innerWidth <= 640;
    
    if (isMobile) {
      // Force leftLocked for mobile devices
      if (store.alignmentLockMode !== 'leftLocked') {
        logger.info('SESSION', 'mobile-alignment-override', { 
          saved: toggles.alignmentLockMode, 
          applied: 'leftLocked' 
        });
        store.setAlignmentLockMode('leftLocked');
      }
    } else if (typeof toggles.alignmentLockMode === 'string' && 
               toggles.alignmentLockMode !== store.alignmentLockMode) {
      // Desktop: restore saved mode, but default to 'auto' if saved mode was 'leftLocked'
      const desktopMode = toggles.alignmentLockMode === 'leftLocked' ? 'auto' : toggles.alignmentLockMode;
      logger.info('SESSION', 'restoring-alignment-lock', { mode: desktopMode });
      store.setAlignmentLockMode(desktopMode as 'auto' | 'centeredLocked' | 'leftLocked');
    }
    
    // Navigate to last verse position if callback provided
    if (navigateToVerse) {
      const finalVerseKey = sessionState.last_verse_key || toggles.last_verse_key;
      if (finalVerseKey) {
        logger.info('SESSION', 'navigate-to-verse', { verseKey: finalVerseKey });
        // Use setTimeout to ensure stores are fully initialized
        setTimeout(() => {
          navigateToVerse(finalVerseKey);
        }, 500); // Wait for stores to initialize
      }
    }
    
    logger.info('SESSION', 'restore-complete');
  } catch (error) {
    logger.error('SESSION', 'restore-exception', { error });
  }
}
