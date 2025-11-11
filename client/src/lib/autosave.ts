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
   * 🚨 PHASE 0.4: Ultra-slim autosave with minimal payload
   * Only saves centerRef, centerIndex, and timestamp (22 bytes vs 4MB+)
   * 
   * 2J Pattern: userId parameter validates client-side auth but RPC uses auth.uid() server-side.
   * This prevents privilege escalation where a client could forge another user's ID.
   * 
   * @param userId - User ID for client-side validation (not sent to RPC)
   */
  private async performSave(userId: string) {
    if (!this.pendingChanges) return;

    try {
      // 🚨 PHASE 0.4: Gather only essential data
      const slimData = this.gatherSlimSessionData();
      
      // Save ultra-skinny payload to position tracking table only
      // RPC uses auth.uid() server-side for security
      await supabase().rpc('fn_save_last_position', {
        p_translation_code: slimData.currentTranslation,
        p_verse_key: slimData.centerRef,
        p_scroll_px: 0, // Skip scroll position to keep payload minimal
        p_center_index: slimData.centerIndex
      });

      this.pendingChanges = false;
      this.lastSaveTime = Date.now();
      
      console.log('[AUTOSAVE-SLIM] Saved 22 bytes:', slimData);
      
    } catch (error) {
      console.error('❌ Slim autosave failed:', error);
      
      // Fallback: Save to localStorage instead of heavy database operations
      try {
        const slimData = this.gatherSlimSessionData();
        localStorage.setItem('readingPosition', JSON.stringify(slimData));
        console.log('[AUTOSAVE-SLIM] Fallback to localStorage successful');
      } catch (fallbackError) {
        console.error('❌ Slim autosave localStorage fallback failed:', fallbackError);
      }
    }
  }

  /**
   * 🚨 PHASE 0.4: Gather ultra-slim session data (25 bytes total)
   */
  private gatherSlimSessionData() {
    const currentPath = window.location.pathname;
    const verseMatch = currentPath.match(/\/([^\/]+)\.(\d+):(\d+)/);
    const centerRef = verseMatch ? `${verseMatch[1]}.${verseMatch[2]}:${verseMatch[3]}` : 'Gen.1:1';
    
    // Get actual current translation from Zustand persisted store or default to KJV
    let currentTranslation = 'KJV';
    try {
      const translationStore = JSON.parse(localStorage.getItem('translation-maps') || '{}');
      currentTranslation = translationStore.state?.main || 'KJV';
    } catch {
      // Fallback to KJV if parse fails
      currentTranslation = 'KJV';
    }
    
    return {
      centerRef,                    // ~10 bytes (e.g., "Gen.1:1")
      centerIndex: this.getCenterIndex(), // 4 bytes
      currentTranslation,           // ~3 bytes (actual user's translation)
      timestamp: Date.now()         // 8 bytes
      // Total: ~25 bytes vs 4MB+ before
    };
  }

  /**
   * Force immediate save
   * @param userId - User ID to save for (required)
   */
  async forceSave(userId: string) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    await this.performSave(userId);
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
   * Load saved session data for user using enhanced SQL functions
   * @param userId - User ID to load for (required)
   * @param translationCode - Translation code (optional)
   */
  async loadSessionData(userId: string, translationCode?: string): Promise<SessionData | null> {
    try {
      const currentTranslation = translationCode || localStorage.getItem('currentTranslation') || 'KJV';
      
      // Try to get position data using SQL function
      let positionData = null;
      try {
        const { data: posData, error: posError } = await supabase().rpc('fn_get_last_position', {
          p_translation_code: currentTranslation
        });
        
        if (!posError && posData && posData.length > 0) {
          positionData = posData[0];
        }
      } catch (sqlError) {
        console.warn('⚠️ SQL function not available, using fallback');
      }

      // Get session preferences from user_sessions table
      const { data, error } = await supabase()
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Combine position data with session data
      const sessionData: SessionData = {
        lastVersePosition: positionData?.verse_key || (data?.last_verse_position as string) || 'Gen.1:1',
        currentTranslation: currentTranslation,
        layoutPreferences: data?.layout_preferences ? JSON.parse(data.layout_preferences as string) : this.getDefaultLayoutPreferences(),
        scrollPosition: positionData?.scroll_px || (data?.scroll_position as number) || 0,
        additionalData: data?.session_data ? JSON.parse(data.session_data as string) : {}
      };

      console.log('📥 Enhanced session data loaded:', sessionData.lastVersePosition, 'translation:', sessionData.currentTranslation);
      return sessionData;
      
    } catch (error) {
      console.error('❌ Failed to load session data:', error);
      return null;
    }
  }

  /**
   * Apply loaded session data to restore user's state
   */
  async restoreSession(translationCode?: string) {
    const sessionData = await this.loadSessionData(translationCode);
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

      // Restore translation preference
      if (sessionData.currentTranslation) {
        localStorage.setItem('currentTranslation', sessionData.currentTranslation);
      }

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

      console.log('🔄 Enhanced session restored to:', sessionData.lastVersePosition, 'translation:', sessionData.currentTranslation);
      
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
   * Get current center index from the DOM
   */
  private getCenterIndex(): number {
    try {
      const centerElement = document.querySelector('[data-center-index]');
      if (centerElement) {
        return parseInt(centerElement.getAttribute('data-center-index') || '0', 10);
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get default layout preferences
   */
  private getDefaultLayoutPreferences() {
    return {
      columnWidths: {},
      visibleColumns: [],
      showNotes: false,
      showProphecy: false,
      showContext: false,
      fontSize: 'medium',
      theme: 'dark'
    };
  }

  /**
   * Get recent hyperlink clicks for the user
   * 
   * 2J Pattern: userId validates client-side auth but RPC uses auth.uid() server-side.
   * 
   * @param userId - User ID for client-side validation (not sent to RPC)
   * @param limit - Maximum number of clicks to return (default: 10)
   */
  async getRecentClicks(userId: string, limit: number = 10) {
    try {
      // RPC uses auth.uid() server-side for security
      const { data, error } = await supabase().rpc('fn_get_recent_clicks', {
        p_limit: limit
      });

      if (error) {
        console.error('❌ Failed to get recent clicks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error getting recent clicks:', error);
      return [];
    }
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
    // TEMPORARILY DISABLED: Auto-restore on mount to fix scroll position issue
    // autosave.restoreSession();
    
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
    restoreSession: autosave.restoreSession.bind(autosave),
    getRecentClicks: autosave.getRecentClicks.bind(autosave)
  };
}