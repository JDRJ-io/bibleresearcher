import { useEffect, useRef, useState, useMemo } from 'react';
import { getVerseKeys, getVerseKeyByIndex } from '@/lib/verseKeysLoader';
import { getVerseIndex } from '@/lib/verseIndexMap';
import { useMobileDetection } from './useMobileDetection';
import { hyperlinkTracker } from '@/lib/hyperlinkTracking';
import { recordNav } from '@/lib/navState';
import { useNavigationHistory } from '@/lib/navigationHistory';
import { useAuth } from '@/contexts/AuthContext';

type ScrollToFn = (ref: string) => void;

const MAX_HISTORY_SIZE = 50;
const SIGNIFICANT_JUMP_THRESHOLD = 3;

// Helper function to get the current center verse position
function getCurrentCenterVerse(verseKeys: string[]): string {
  try {
    // First try to get from DOM element with center index
    const centerElement = document.querySelector('[data-center-index]');
    if (centerElement) {
      const centerIndexStr = centerElement.getAttribute('data-center-index');
      if (centerIndexStr) {
        const centerIndex = parseInt(centerIndexStr, 10);
        if (!isNaN(centerIndex) && centerIndex >= 0 && centerIndex < verseKeys.length) {
          const currentVerse = getVerseKeyByIndex(centerIndex);
          console.log('🎯 Current center verse from DOM:', currentVerse, 'at index:', centerIndex);
          return currentVerse;
        }
      }
    }

    // Fallback: try to get from URL hash
    const hash = window.location.hash;
    if (hash && hash.startsWith('#')) {
      const hashVerse = hash.substring(1);
      if (verseKeys.includes(hashVerse)) {
        console.log('🎯 Current center verse from URL hash:', hashVerse);
        return hashVerse;
      }
    }

    // Final fallback
    console.log('🎯 Using fallback current verse: Gen.1:1');
    return 'Gen.1:1';
  } catch (error) {
    console.warn('⚠️ Error getting current center verse:', error);
    return 'Gen.1:1';
  }
}

export function useVerseNav(scrollToVerse: ScrollToFn) {
  const { user } = useAuth();
  const verseKeys = getVerseKeys();
  const isMobile = useMobileDetection();
  const lastPushed = useRef<string | null>(null);
  
  // Track the LAST NAVIGATION POINT (where user last jumped to via hyperlink/search)
  const lastNavigationPointRef = useRef<string>('Gen.1:1');
  
  // Use centralized navigation history manager (loads from database, syncs across sessions)
  const navHistory = useNavigationHistory();

  // Call this when a link is clicked or scroll wheel navigation is used
  const goTo = async (ref: string, isUserInitiated: boolean = true) => {
    const norm = ref.trim();
    console.log('🚀 useVerseNav goTo called with:', ref, 'normalized:', norm, 'mobile:', isMobile);
    
    // Get ACTUAL current scroll position from DOM (not from ref!)
    const currentScrollPosition = getCurrentCenterVerse(verseKeys);
    console.log('🎯 Current scroll position from DOM:', currentScrollPosition, 'navigating to:', norm);
    
    // Get the last navigation point (where user last jumped to)
    const lastNavigationPoint = lastNavigationPointRef.current;
    console.log('📍 Last navigation point:', lastNavigationPoint);
    
    // Calculate distance: How far has the user SCROLLED from their last navigation point?
    const lastNavIndex = getVerseIndex(lastNavigationPoint);
    const currentScrollIndex = getVerseIndex(currentScrollPosition);
    const targetIndex = getVerseIndex(norm);
    
    // Guard against invalid references (getVerseIndex returns -1 for unknown verses)
    const hasValidIndices = lastNavIndex >= 0 && currentScrollIndex >= 0 && targetIndex >= 0;
    const scrolledDistance = hasValidIndices ? Math.abs(currentScrollIndex - lastNavIndex) : 0;
    const shouldRememberPosition = hasValidIndices && scrolledDistance > SIGNIFICANT_JUMP_THRESHOLD;
    
    console.log('📏 Scroll tracking:', {
      lastNavigationPoint,
      currentScrollPosition,
      targetVerse: norm,
      lastNavIndex,
      currentScrollIndex,
      targetIndex,
      scrolledDistance,
      shouldRememberPosition,
      validIndices: hasValidIndices
    });
    
    // IMMEDIATE NAVIGATION: Scroll first for instant response
    scrollToVerse(norm);
    
    // Update the last navigation point to the new target
    lastNavigationPointRef.current = norm;
    
    // ASYNC OPERATIONS: Handle tracking and history updates asynchronously
    setTimeout(() => {
      console.log('📚 Current history state:', navHistory.history.length, 'entries, index:', navHistory.currentIndex);
      
      // Record navigation to update user_last_location (only for intentional navigation)
      if (isUserInitiated && user?.id) {
        // Get current translation from hyperlinkTracker
        const currentTranslation = hyperlinkTracker.getCurrentTranslation() || 'KJV';
        recordNav(user.id, norm, currentTranslation);
        
        // Add to centralized navigation history (syncs to database)
        navHistory.addToHistory(norm, currentTranslation);
      }
      
      // Track verse jump if user-initiated
      if (isUserInitiated) {
        setTimeout(async () => {
          try {
            const currentVerse = hyperlinkTracker.getCurrentVersePosition();
            const currentTranslation = hyperlinkTracker.getCurrentTranslation();
            const context = {
              ...hyperlinkTracker.getCurrentContext(),
              navigationSource: 'verse_nav',
              scrolledDistance,
              shouldRememberPosition,
              jumpedFrom: shouldRememberPosition ? currentScrollPosition : undefined
            };
            
            await hyperlinkTracker.trackVerseJump(
              currentScrollPosition,
              norm,
              currentTranslation,
              context
            );
          } catch (trackingError) {
            console.warn('⚠️ Failed to track verse jump:', trackingError);
          }
        }, 0);
      }
      
      // Trigger loading detection for navigation (smart loading system)
      const loadingEvent = new CustomEvent('navigationStarted', { 
        detail: { reference: norm, isMobile } 
      });
      window.dispatchEvent(loadingEvent);
    }, 0);

    // Desktop: Use browser history for browser back/forward button support
    if (!isMobile) {
      // Desktop: Use browser history with better state management
      if (norm && norm !== lastPushed.current) {
        const currentState = window.history.state;
        const currentStateVerse = currentState?.ref;
        
        // SMART HISTORY TRACKING: Remember current scroll position ONLY if user scrolled 3+ verses
        // from their last navigation point
        if (shouldRememberPosition && currentScrollPosition !== currentStateVerse && currentScrollPosition !== norm) {
          window.history.pushState({ 
            ref: currentScrollPosition, 
            timestamp: Date.now(),
            type: 'verse-navigation',
            scrolledDistance,
            jumpedTo: norm
          }, '', `#${currentScrollPosition}`);
          console.log('🖥️ Desktop history pushed scroll position (scrolled', scrolledDistance, 'verses from last nav):', currentScrollPosition);
        }
        
        // Then push the target verse
        window.history.pushState({ 
          ref: norm, 
          timestamp: Date.now(),
          type: 'verse-navigation',
          scrolledDistance,
          jumpedFrom: shouldRememberPosition ? currentScrollPosition : undefined
        }, '', `#${norm}`);
        lastPushed.current = norm;
        console.log('🖥️ Desktop history pushed target verse:', norm, 'total entries:', window.history.length);
      }
    }
    
    // Stop loading after navigation completes (no delay needed)
    setTimeout(() => {
      const loadingCompleteEvent = new CustomEvent('navigationCompleted', { 
        detail: { reference: norm } 
      });
      window.dispatchEvent(loadingCompleteEvent);
    }, 0);
  };

  // Handle back navigation using centralized history
  const goBack = async () => {
    console.log('🔙 goBack called - canGoBack:', navHistory.canGoBack);
    
    let targetRef = '';
    let navigationSuccessful = false;
    
    if (isMobile) {
      // Mobile: Use centralized navigation history
      const entry = navHistory.goBack();
      if (entry) {
        targetRef = entry.verse_reference;
        console.log('📱 Mobile back to:', targetRef, 'from history');
        scrollToVerse(targetRef);
        lastNavigationPointRef.current = targetRef; // Update last navigation point
        navigationSuccessful = true;
      } else {
        console.log('📱 Cannot go back - at beginning of history');
        navigationSuccessful = false;
      }
    } else {
      // Desktop: Use browser back
      console.log('🖥️ Desktop browser back');
      window.history.back();
      navigationSuccessful = true;
    }
    
    // Track back navigation if successful
    if (navigationSuccessful && targetRef) {
      try {
        const currentVerse = hyperlinkTracker.getCurrentVersePosition();
        const currentTranslation = hyperlinkTracker.getCurrentTranslation();
        const context = {
          ...hyperlinkTracker.getCurrentContext(),
          navigationSource: 'back_button'
        };
        
        await hyperlinkTracker.trackNavigation(
          currentVerse,
          targetRef,
          currentTranslation,
          'back',
          context
        );
      } catch (trackingError) {
        console.warn('⚠️ Failed to track back navigation:', trackingError);
      }
    }
    
    return navigationSuccessful;
  };

  const goForward = async () => {
    console.log('🔜 goForward called - canGoForward:', navHistory.canGoForward);
    
    let targetRef = '';
    let navigationSuccessful = false;
    
    if (isMobile) {
      // Mobile: Use centralized navigation history
      const entry = navHistory.goForward();
      if (entry) {
        targetRef = entry.verse_reference;
        console.log('📱 Mobile forward to:', targetRef, 'from history');
        scrollToVerse(targetRef);
        lastNavigationPointRef.current = targetRef; // Update last navigation point
        navigationSuccessful = true;
      } else {
        console.log('📱 Cannot go forward - at end of history');
        navigationSuccessful = false;
      }
    } else {
      // Desktop: Use browser forward
      console.log('🖥️ Desktop browser forward');
      window.history.forward();
      navigationSuccessful = true;
    }
    
    // Track forward navigation if successful
    if (navigationSuccessful && targetRef) {
      try {
        const currentVerse = hyperlinkTracker.getCurrentVersePosition();
        const currentTranslation = hyperlinkTracker.getCurrentTranslation();
        const context = {
          ...hyperlinkTracker.getCurrentContext(),
          navigationSource: 'forward_button'
        };
        
        await hyperlinkTracker.trackNavigation(
          currentVerse,
          targetRef,
          currentTranslation,
          'forward',
          context
        );
      } catch (trackingError) {
        console.warn('⚠️ Failed to track forward navigation:', trackingError);
      }
    }
    
    return navigationSuccessful;
  };

  // Use centralized history for mobile, browser history for desktop
  // Desktop: Always true because browser handles it, mobile: use centralized history
  const canGoBack = isMobile ? navHistory.canGoBack : (window.history.length > 1);
  const canGoForward = isMobile ? navHistory.canGoForward : true; // Desktop can always attempt forward

  // Desktop only: Handle browser popstate events
  useEffect(() => {
    if (isMobile) return; // Skip browser history on mobile
    
    const onPop = (e: PopStateEvent) => {
      console.log('🔙 Desktop popstate triggered:', e.state);
      
      // FIXED: Only respond to actual user-initiated back/forward actions, not page loads
      // Don't auto-navigate on page refresh or initial load
      if (e.state && e.state.ref && e.state.type === 'verse-navigation') {
        const ref = e.state.ref;
        console.log('🔙 Desktop navigating to:', ref);
        scrollToVerse(ref);
        lastPushed.current = ref;
        lastNavigationPointRef.current = ref; // Update last navigation point
      } else {
        console.log('🔙 Desktop popstate ignored - not a user navigation event');
      }
    };
    
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [scrollToVerse, isMobile]);

  // Memoize the return object to prevent infinite re-renders
  return useMemo(() => ({ 
    goTo, 
    goBack, 
    goForward, 
    canGoBack, 
    canGoForward 
  }), [goTo, goBack, goForward, canGoBack, canGoForward]);
}