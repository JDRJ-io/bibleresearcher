/**
 * Navigation History System
 * Tracks the last 10 verse locations visited by user with back/forward navigation
 */

import { supabase } from './supabaseClient';
import type { NavigationHistory, InsertNavigationHistory } from '@shared/schema';
import { logger } from '@/lib/logger';

/**
 * Track navigation to verse (call Supabase RPC push_nav_jump)
 * 
 * 2J Pattern: userId is validated on client-side but NOT passed to RPC.
 * The RPC uses auth.uid() server-side for security - this prevents privilege
 * escalation where a client could forge another user's ID.
 * 
 * @param userId - User ID for client-side validation (not sent to server)
 * @param verseKey - Verse reference to track (e.g., "Gen.1:1")
 */
export async function trackNavigationJump(userId: string, verseKey: string) {
  try {
    logger.debug('NAV', 'track-jump', { verseKey });
    
    // RPC uses auth.uid() server-side for security
    const { error } = await supabase().rpc('push_nav_jump', {
      p_verse_key: verseKey
    });
    
    if (error) {
      logger.error('NAV', 'track-failed', { error, verseKey });
    } else {
      logger.debug('NAV', 'track-success', { verseKey });
    }
  } catch (error) {
    // Silent fail - don't interrupt navigation
    logger.error('NAV', 'track-exception', { error, verseKey });
  }
}

interface HistoryEntry {
  verse_reference: string;
  translation: string;
  visited_at: string;
}

class NavigationHistoryManager {
  private history: HistoryEntry[] = [];
  private currentIndex = -1;
  private maxHistory = 50;
  private initialized = false;
  
  constructor() {
  }

  /**
   * Initialize navigation history (call from AuthContext after session is known)
   */
  async initialize(userId: string) {
    if (this.initialized) {
      logger.debug('NAV', 'already-initialized');
      return;
    }
    
    logger.debug('NAV', 'initializing', { userId });
    await this.loadHistory(userId);
    this.initialized = true;
  }

  /**
   * Load navigation history from database
   */
  private async loadHistory(userId: string) {
    try {
      const { data, error } = await supabase()
        .from('navigation_history')
        .select('verse_reference, translation, visited_at')
        .eq('user_id', userId)
        .order('visited_at', { ascending: false })
        .limit(this.maxHistory);

      if (error) throw error;
      
      this.history = (data || []).map((row: any) => ({
        verse_reference: row.verse_reference as string,
        translation: row.translation as string,
        visited_at: row.visited_at as string
      }));
      this.currentIndex = this.history.length > 0 ? 0 : -1;
      
      console.log('📚 Navigation history loaded:', this.history.length, 'entries');
      
      // Notify listeners so UI (back/forward buttons) updates immediately
      this.notifyHistoryChange();
    } catch (error) {
      console.error('❌ Failed to load navigation history:', error);
    }
  }

  /**
   * Add a new verse to navigation history (in-memory only)
   * Database persistence is handled by recordNav() in navState.ts
   */
  addToHistory(verseReference: string, translation: string = 'KJV') {
    // Don't add duplicate consecutive entries
    const lastEntry = this.history[0];
    if (lastEntry && lastEntry.verse_reference === verseReference && lastEntry.translation === translation) {
      return;
    }

    // Add to local in-memory history
    const newEntry: HistoryEntry = {
      verse_reference: verseReference,
      translation: translation,
      visited_at: new Date().toISOString()
    };

    this.history.unshift(newEntry);
    
    // Keep only last 15 entries
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }

    this.currentIndex = 0;
    
    console.log('📍 Added to navigation history (in-memory):', verseReference);
    this.notifyHistoryChange();
  }

  /**
   * Navigate back in history
   */
  goBack(): HistoryEntry | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      const entry = this.history[this.currentIndex];
      console.log('⬅️ Navigate back to:', entry.verse_reference);
      this.notifyHistoryChange();
      return entry;
    }
    return null;
  }

  /**
   * Navigate forward in history
   */
  goForward(): HistoryEntry | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const entry = this.history[this.currentIndex];
      console.log('➡️ Navigate forward to:', entry.verse_reference);
      this.notifyHistoryChange();
      return entry;
    }
    return null;
  }

  /**
   * Get current history state
   */
  getHistoryState() {
    return {
      history: this.history,
      currentIndex: this.currentIndex,
      canGoBack: this.currentIndex < this.history.length - 1,
      canGoForward: this.currentIndex > 0,
      recentHistory: this.history.slice(0, 5) // Show last 5 for UI
    };
  }

  /**
   * Clean up old entries beyond the limit
   * Uses server-side RPC for better performance and security
   * 
   * 2J Pattern: RPC uses auth.uid() server-side for security.
   * userId parameter is used only for client-side fallback.
   * 
   * @param userId - User ID for client-side fallback cleanup
   */
  private async cleanupOldEntries(userId: string) {
    try {
      // Try server-side RPC first (more efficient)
      // RPC uses auth.uid() server-side, doesn't need userId parameter
      const { error: rpcError } = await supabase().rpc('cleanup_nav_history', { 
        p_keep: this.maxHistory 
      });

      if (rpcError) {
        // Fallback to client-side cleanup if RPC not available
        console.debug('RPC cleanup not available, using client-side fallback');
        await this.cleanupByIds(userId);
      }
    } catch (error) {
      console.error('❌ Failed to cleanup navigation history:', error);
    }
  }

  /**
   * Client-side fallback cleanup (safer than string interpolation)
   */
  private async cleanupByIds(userId: string) {
    // Get IDs of entries to keep
    const { data: keepRows, error: selErr } = await supabase()
      .from('navigation_history')
      .select('id')
      .eq('user_id', userId)
      .order('visited_at', { ascending: false })
      .limit(this.maxHistory);

    if (selErr || !keepRows) {
      console.error('❌ Failed to load keep IDs:', selErr);
      return;
    }

    const keepIds = keepRows.map((r: any) => r.id);
    const safeIds = keepIds.length ? keepIds : [-1]; // guard empty array

    // Delete entries not in the keep list
    const { error: delErr } = await supabase()
      .from('navigation_history')
      .delete()
      .eq('user_id', userId)
      .not('id', 'in', `(${safeIds.join(',')})`);

    if (delErr) {
      console.error('❌ Failed to cleanup navigation history:', delErr);
    }
  }

  /**
   * Notify listeners of history changes
   */
  private notifyHistoryChange() {
    const event = new CustomEvent('navigationHistoryChanged', { 
      detail: this.getHistoryState() 
    });
    window.dispatchEvent(event);
  }

  /**
   * Clear all navigation history
   */
  async clearHistory(userId: string) {
    try {
      const { error } = await supabase()
        .from('navigation_history')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      this.history = [];
      this.currentIndex = -1;
      
      console.log('🧹 Navigation history cleared');
      this.notifyHistoryChange();
      
    } catch (error) {
      console.error('❌ Failed to clear navigation history:', error);
    }
  }
}

import React from 'react';

// Export singleton instance
export const navigationHistory = new NavigationHistoryManager();

// Hook for React components
export function useNavigationHistory() {
  const [historyState, setHistoryState] = React.useState(navigationHistory.getHistoryState());

  React.useEffect(() => {
    const handleHistoryChange = (event: CustomEvent) => {
      setHistoryState(event.detail);
    };

    window.addEventListener('navigationHistoryChanged', handleHistoryChange as EventListener);
    
    return () => {
      window.removeEventListener('navigationHistoryChanged', handleHistoryChange as EventListener);
    };
  }, []);

  // Memoize the return object to prevent infinite re-renders
  return React.useMemo(() => ({
    ...historyState,
    addToHistory: navigationHistory.addToHistory.bind(navigationHistory),
    goBack: navigationHistory.goBack.bind(navigationHistory),
    goForward: navigationHistory.goForward.bind(navigationHistory),
    clearHistory: (userId: string) => navigationHistory.clearHistory(userId)
  }), [historyState]);
}