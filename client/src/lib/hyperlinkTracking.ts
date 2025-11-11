/**
 * Hyperlink Tracking Service
 * Tracks user navigation through cross-references, prophecies, and other verse jumps
 * with detailed context that persists to the database
 */

import { supabase } from './supabaseClient';
import { authWithTimeout } from './withTimeout';

export type HyperlinkClickPayload = {
  clickType: 'cross_ref' | 'prophecy' | 'search' | 'strongs' | 'verse_jump' | 'back' | 'forward';
  fromRef?: string;
  toRef?: string;
  sourcePanel?: string; // 'cross_ref' | 'prophecy' | 'search' | 'master' | etc.
  translation?: string; // active translation at the time
  meta?: Record<string, any>; // {prophecyId, searchTerm, strongsKey, scrollDistance, ...}
};

/**
 * Fire-and-forget hyperlink click tracking
 * Does not block UI, gracefully handles auth timeouts
 * @param userId - User ID to track for (required)
 * @param payload - Hyperlink click data
 */
export async function trackHyperlinkClick(userId: string, payload: HyperlinkClickPayload): Promise<void> {
  try {
    const sb = supabase();

    const { error } = await sb.rpc('fn_push_hyperlink_click', {
      p_click_type: payload.clickType,
      p_from_ref: payload.fromRef ?? null,
      p_to_ref: payload.toRef ?? null,
      p_source_panel: payload.sourcePanel ?? null,
      p_translation: payload.translation ?? null,
      p_meta: payload.meta ?? {}
    });

    // Quiet in production
    if (error && import.meta.env.MODE !== 'production') {
      console.warn('fn_push_hyperlink_click error', error);
    }
  } catch {
    // Silent fail - tracking is nice-to-have, not critical
  }
}

/**
 * Load recent hyperlink clicks for the current user
 * @param userId - User ID to load clicks for (required)
 * @param limit - Maximum number of clicks to return (default: 50)
 */
export async function loadRecentClicks(userId: string, limit = 50): Promise<any[]> {
  const sb = supabase();

  const { data, error } = await sb.rpc('fn_get_recent_clicks', { p_limit: limit });
  if (error) return [];
  return Array.isArray(data) ? data : [];
}

// Legacy class-based API for backward compatibility
class HyperlinkTracker {
  async trackCrossReferenceClick(
    userId: string,
    fromVerse: string,
    targetVerse: string,
    translationCode: string,
    sourceContext?: Record<string, any>
  ): Promise<void> {
    await trackHyperlinkClick(userId, {
      clickType: 'cross_ref',
      fromRef: fromVerse,
      toRef: targetVerse,
      sourcePanel: sourceContext?.panel || 'cross_ref',
      translation: translationCode,
      meta: sourceContext
    });
  }

  async trackProphecyClick(
    userId: string,
    fromVerse: string,
    prophecyId: string,
    targetVerse: string,
    translationCode: string,
    sourceContext?: Record<string, any>
  ): Promise<void> {
    await trackHyperlinkClick(userId, {
      clickType: 'prophecy',
      fromRef: fromVerse,
      toRef: targetVerse,
      sourcePanel: 'prophecy',
      translation: translationCode,
      meta: { ...sourceContext, prophecyId }
    });
  }

  async trackVerseJump(
    userId: string,
    fromVerse: string,
    targetVerse: string,
    translationCode: string,
    sourceContext?: Record<string, any>
  ): Promise<void> {
    await trackHyperlinkClick(userId, {
      clickType: 'verse_jump',
      fromRef: fromVerse,
      toRef: targetVerse,
      sourcePanel: sourceContext?.panel,
      translation: translationCode,
      meta: sourceContext
    });
  }

  async trackNavigation(
    userId: string,
    fromVerse: string,
    targetVerse: string,
    translationCode: string,
    direction: 'back' | 'forward',
    sourceContext?: Record<string, any>
  ): Promise<void> {
    await trackHyperlinkClick(userId, {
      clickType: direction,
      fromRef: fromVerse,
      toRef: targetVerse,
      translation: translationCode,
      meta: sourceContext
    });
  }

  async getRecentClicks(userId: string, limit: number = 10) {
    return loadRecentClicks(userId, limit);
  }

  /**
   * Get current verse position from the DOM or URL
   */
  getCurrentVersePosition(): string {
    // Try to get from URL first
    const currentPath = window.location.pathname;
    const verseMatch = currentPath.match(/\/([^\/]+)\.(\d+):(\d+)/);
    if (verseMatch) {
      return `${verseMatch[1]}.${verseMatch[2]}:${verseMatch[3]}`;
    }

    // Try to get from DOM element with center index
    try {
      const centerElement = document.querySelector('[data-center-index]');
      if (centerElement) {
        const verseRef = centerElement.getAttribute('data-verse-ref');
        if (verseRef) return verseRef;
      }
    } catch (error) {
      console.warn('Could not get verse position from DOM:', error);
    }

    // Fallback to Genesis 1:1
    return 'Gen.1:1';
  }

  /**
   * Get current translation from localStorage or default
   */
  getCurrentTranslation(): string {
    return localStorage.getItem('currentTranslation') || 'KJV';
  }

  /**
   * Get current context information for tracking
   */
  getCurrentContext(): Record<string, any> {
    return {
      scrollPosition: window.scrollY || document.documentElement.scrollTop || 0,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      timestamp: Date.now()
    };
  }
}

// Export singleton instance
export const hyperlinkTracker = new HyperlinkTracker();

// React hook for hyperlink tracking
export function useHyperlinkTracking() {
  return {
    trackCrossReferenceClick: hyperlinkTracker.trackCrossReferenceClick.bind(hyperlinkTracker),
    trackProphecyClick: hyperlinkTracker.trackProphecyClick.bind(hyperlinkTracker),
    trackVerseJump: hyperlinkTracker.trackVerseJump.bind(hyperlinkTracker),
    trackNavigation: hyperlinkTracker.trackNavigation.bind(hyperlinkTracker),
    getRecentClicks: hyperlinkTracker.getRecentClicks.bind(hyperlinkTracker),
    getCurrentVersePosition: hyperlinkTracker.getCurrentVersePosition.bind(hyperlinkTracker),
    getCurrentTranslation: hyperlinkTracker.getCurrentTranslation.bind(hyperlinkTracker),
    getCurrentContext: hyperlinkTracker.getCurrentContext.bind(hyperlinkTracker)
  };
}