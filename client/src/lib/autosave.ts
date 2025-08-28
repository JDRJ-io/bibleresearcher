/**
 * Autosave System
 * Automatically saves user's current position, layout preferences, and session state
 */

import { supabase } from './supabaseClient';
import { saveSession } from './userDataApi';
import type { UserSession, InsertUserSession } from '@shared/schema';

interface SessionData {
  lastVersePosition: string;
  currentTranslation: string;
  layoutPreferences: {
    columnWidths: Record<string, number>;
    visibleColumns: string[];
    showNotes: boolean;
    showProphecy: boolean;
    showContext: boolean;
    fontSize: string;
    theme: string;
  };
  scrollPosition: number;
  additionalData: Record<string, any>;
}

class AutosaveManager {
  private saveInterval: NodeJS.Timeout | null = null;
  private pendingChanges = false;
  private lastSaveTime = 0;
  private saveDelayMs = 3000; // Save after 3 seconds of inactivity
  private maxSaveIntervalMs = 30000; // Force save every 30 seconds

  constructor() {
    this.initializeAutosave();
  }

  /**
   * Initialize autosave system with event listeners
   */
  private initializeAutosave() {
    // Save on page unload
    window.addEventListener('beforeunload', this.forceSave.bind(this));
    window.addEventListener('pagehide', this.forceSave.bind(this));
    
    // Save on visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.forceSave();
      }
    });

    // Start periodic autosave
    this.startPeriodicSave();
    
    console.log('💾 Autosave system initialized');
  }

  /**
   * Start periodic autosave interval
   */
  private startPeriodicSave() {
    if (this.saveInterval) clearInterval(this.saveInterval);
    
    this.saveInterval = setInterval(() => {
      const now = Date.now();
      if (this.pendingChanges && (now - this.lastSaveTime) >= this.maxSaveIntervalMs) {
        this.performSave();
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Mark that changes need to be saved
   */
  markForSave() {
    this.pendingChanges = true;
    this.debouncedSave();
  }

  /**
   * Debounced save - waits for inactivity before saving
   */
  private debouncedSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.performSave();
    }, this.saveDelayMs);
  }
  
  private saveTimeout: NodeJS.Timeout | null = null;

  /**
   * Perform the actual save operation
   */
  private async performSave() {
    if (!this.pendingChanges) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sessionData = this.gatherSessionData();
      
      await supabase.from('user_sessions').upsert({
        user_id: user.id,
        last_verse_position: sessionData.lastVersePosition,
        current_translation: sessionData.currentTranslation,
        layout_preferences: JSON.stringify(sessionData.layoutPreferences),
        scroll_position: sessionData.scrollPosition,
        session_data: JSON.stringify(sessionData.additionalData),
        last_active: new Date().toISOString()
      }, { onConflict: 'user_id' });

      this.pendingChanges = false;
      this.lastSaveTime = Date.now();
      
      console.log('💾 Session autosaved:', sessionData.lastVersePosition);
      
    } catch (error) {
      console.error('❌ Autosave failed:', error);
    }
  }

  /**
   * Force immediate save
   */
  async forceSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    await this.performSave();
  }

  /**
   * Gather current session data from the application
   */
  private gatherSessionData(): SessionData {
    // Get current verse position from URL or global state
    const currentPath = window.location.pathname;
    const verseMatch = currentPath.match(/\/([^\/]+)\.(\d+):(\d+)/);
    const lastVersePosition = verseMatch ? `${verseMatch[1]}.${verseMatch[2]}:${verseMatch[3]}` : 'Gen.1:1';

    // Get layout preferences from localStorage and CSS variables
    const layoutPreferences = {
      columnWidths: this.getColumnWidths(),
      visibleColumns: this.getVisibleColumns(),
      showNotes: localStorage.getItem('showNotes') === 'true',
      showProphecy: localStorage.getItem('showProphecy') === 'true',
      showContext: localStorage.getItem('showContext') === 'true',
      fontSize: localStorage.getItem('fontSize') || 'medium',
      theme: localStorage.getItem('theme') || 'dark'
    };

    // Get scroll position
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || 0;

    // Get current translation from global state or localStorage
    const currentTranslation = localStorage.getItem('currentTranslation') || 'KJV';

    // Additional data from various sources
    const additionalData = {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      userAgent: navigator.userAgent.substring(0, 100), // Truncated for privacy
      timestamp: Date.now()
    };

    return {
      lastVersePosition,
      currentTranslation,
      layoutPreferences,
      scrollPosition,
      additionalData
    };
  }

  /**
   * Get current column widths from CSS variables
   */
  private getColumnWidths(): Record<string, number> {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    return {
      reference: parseInt(computedStyle.getPropertyValue('--adaptive-ref-width')) || 50,
      mainTranslation: parseInt(computedStyle.getPropertyValue('--adaptive-main-width')) || 300,
      crossReference: parseInt(computedStyle.getPropertyValue('--adaptive-cross-width')) || 300,
      alternate: parseInt(computedStyle.getPropertyValue('--adaptive-alt-width')) || 300,
      prophecy: parseInt(computedStyle.getPropertyValue('--adaptive-prophecy-width')) || 300,
      notes: parseInt(computedStyle.getPropertyValue('--adaptive-notes-width')) || 200,
      context: parseInt(computedStyle.getPropertyValue('--adaptive-context-width')) || 40
    };
  }

  /**
   * Get currently visible columns
   */
  private getVisibleColumns(): string[] {
    const visibleColumns: string[] = [];
    
    // Check which columns are currently visible in the DOM
    const columnSelectors = [
      { name: 'reference', selector: '[data-column="reference"]' },
      { name: 'mainTranslation', selector: '[data-column="main-translation"]' },
      { name: 'crossReference', selector: '[data-column="cross-reference"]' },
      { name: 'alternate', selector: '[data-column="alternate"]' },
      { name: 'prophecy', selector: '[data-column="prophecy"]' },
      { name: 'notes', selector: '[data-column="notes"]' },
      { name: 'context', selector: '[data-column="context"]' }
    ];

    columnSelectors.forEach(({ name, selector }) => {
      const element = document.querySelector(selector);
      if (element && !element.classList.contains('hidden')) {
        visibleColumns.push(name);
      }
    });

    return visibleColumns;
  }

  /**
   * Load saved session data for user
   */
  async loadSessionData(): Promise<SessionData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) return null;

      const sessionData: SessionData = {
        lastVersePosition: (data.last_verse_position as string) || 'Gen.1:1',
        currentTranslation: (data.current_translation as string) || 'KJV',
        layoutPreferences: data.layout_preferences ? JSON.parse(data.layout_preferences as string) : {},
        scrollPosition: (data.scroll_position as number) || 0,
        additionalData: data.session_data ? JSON.parse(data.session_data as string) : {}
      };

      console.log('📥 Session data loaded:', sessionData.lastVersePosition);
      return sessionData;
      
    } catch (error) {
      console.error('❌ Failed to load session data:', error);
      return null;
    }
  }

  /**
   * Apply loaded session data to restore user's state
   */
  async restoreSession() {
    const sessionData = await this.loadSessionData();
    if (!sessionData) return;

    try {
      // Restore layout preferences
      const { layoutPreferences } = sessionData;
      
      if (layoutPreferences.theme) {
        localStorage.setItem('theme', layoutPreferences.theme);
        document.documentElement.className = layoutPreferences.theme === 'dark' ? 'dark' : '';
      }

      if (layoutPreferences.fontSize) {
        localStorage.setItem('fontSize', layoutPreferences.fontSize);
      }

      // Restore column visibility
      Object.entries(layoutPreferences).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          localStorage.setItem(key, value.toString());
        }
      });

      // Navigate to last position
      if (sessionData.lastVersePosition && sessionData.lastVersePosition !== 'Gen.1:1') {
        const event = new CustomEvent('restorePosition', {
          detail: {
            verseReference: sessionData.lastVersePosition,
            translation: sessionData.currentTranslation,
            scrollPosition: sessionData.scrollPosition
          }
        });
        window.dispatchEvent(event);
      }

      console.log('🔄 Session restored to:', sessionData.lastVersePosition);
      
    } catch (error) {
      console.error('❌ Failed to restore session:', error);
    }
  }

  /**
   * Update session data immediately
   */
  updateSessionData(data: Partial<SessionData>) {
    // Trigger a save with new data
    this.markForSave();
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    window.removeEventListener('beforeunload', this.forceSave.bind(this));
    window.removeEventListener('pagehide', this.forceSave.bind(this));
  }
}

import React from 'react';

// Export singleton instance
export const autosave = new AutosaveManager();

// Hook for React components  
export function useAutosave() {
  React.useEffect(() => {
    // Auto-restore on mount
    autosave.restoreSession();
    
    return () => {
      // Force save on unmount
      autosave.forceSave();
    };
  }, []);

  return {
    markForSave: autosave.markForSave.bind(autosave),
    forceSave: autosave.forceSave.bind(autosave),
    updateSessionData: autosave.updateSessionData.bind(autosave),
    loadSessionData: autosave.loadSessionData.bind(autosave),
    restoreSession: autosave.restoreSession.bind(autosave)
  };
}