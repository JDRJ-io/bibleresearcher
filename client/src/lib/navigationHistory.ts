/**
 * Navigation History System
 * Tracks the last 10 verse locations visited by user with back/forward navigation
 */

import { supabase } from './supabaseClient';
import type { NavigationHistory, InsertNavigationHistory } from '@shared/schema';

interface HistoryEntry {
  verse_reference: string;
  translation: string;
  visited_at: string;
}

class NavigationHistoryManager {
  private history: HistoryEntry[] = [];
  private currentIndex = -1;
  private maxHistory = 10;
  
  constructor() {
    this.loadHistory();
  }

  /**
   * Load navigation history from database
   */
  private async loadHistory() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('navigation_history')
        .select('verse_reference, translation, visited_at')
        .eq('user_id', user.id)
        .order('visited_at', { ascending: false })
        .limit(this.maxHistory);

      if (error) throw error;
      
      this.history = (data || []).map(row => ({
        verse_reference: row.verse_reference as string,
        translation: row.translation as string,
        visited_at: row.visited_at as string
      }));
      this.currentIndex = this.history.length > 0 ? 0 : -1;
      
      console.log('📚 Navigation history loaded:', this.history.length, 'entries');
    } catch (error) {
      console.error('❌ Failed to load navigation history:', error);
    }
  }

  /**
   * Add a new verse to navigation history
   */
  async addToHistory(verseReference: string, translation: string = 'KJV') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Don't add duplicate consecutive entries
      const lastEntry = this.history[0];
      if (lastEntry && lastEntry.verse_reference === verseReference && lastEntry.translation === translation) {
        return;
      }

      // Add to database
      const { error } = await supabase
        .from('navigation_history')
        .insert({
          user_id: user.id,
          verse_reference: verseReference,
          translation: translation
        });

      if (error) throw error;

      // Add to local history
      const newEntry: HistoryEntry = {
        verse_reference: verseReference,
        translation: translation,
        visited_at: new Date().toISOString()
      };

      this.history.unshift(newEntry);
      
      // Keep only last 10 entries
      if (this.history.length > this.maxHistory) {
        this.history = this.history.slice(0, this.maxHistory);
        
        // Clean up old entries from database
        await this.cleanupOldEntries();
      }

      this.currentIndex = 0;
      
      console.log('📍 Added to navigation history:', verseReference);
      this.notifyHistoryChange();
      
    } catch (error) {
      console.error('❌ Failed to add to navigation history:', error);
    }
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
   */
  private async cleanupOldEntries() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('navigation_history')
        .delete()
        .eq('user_id', user.id)
        .not('id', 'in', `(
          SELECT id FROM navigation_history 
          WHERE user_id = '${user.id}' 
          ORDER BY visited_at DESC 
          LIMIT ${this.maxHistory}
        )`);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Failed to cleanup navigation history:', error);
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
  async clearHistory() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('navigation_history')
        .delete()
        .eq('user_id', user.id);

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

  return {
    ...historyState,
    addToHistory: navigationHistory.addToHistory.bind(navigationHistory),
    goBack: navigationHistory.goBack.bind(navigationHistory),
    goForward: navigationHistory.goForward.bind(navigationHistory),
    clearHistory: navigationHistory.clearHistory.bind(navigationHistory)
  };
}