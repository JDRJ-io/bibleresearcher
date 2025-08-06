import { useEffect, useRef, useState } from 'react';
import { getVerseKeys } from '@/lib/verseKeysLoader';
import { useMobileDetection } from './useMobileDetection';

type ScrollToFn = (ref: string) => void;

const MAX_HISTORY_SIZE = 10;

export function useVerseNav(scrollToVerse: ScrollToFn) {
  const verseKeys = getVerseKeys();
  const isMobile = useMobileDetection();
  const lastPushed = useRef<string | null>(null);
  
  // Mobile-only: internal navigation history stack (limit to 20 entries)
  const [mobileHistory, setMobileHistory] = useState<string[]>([]);
  const [mobileHistoryIndex, setMobileHistoryIndex] = useState(-1);

  // Call this when a link is clicked or scroll wheel navigation is used
  const goTo = (ref: string) => {
    const norm = ref.trim();
    console.log('🚀 useVerseNav goTo called with:', ref, 'normalized:', norm, 'mobile:', isMobile);
    console.log('📚 Current history state:', isMobile ? 
      { mobileHistory: mobileHistory.length, index: mobileHistoryIndex } : 
      { browserHistory: window.history.length });
    
    // Trigger loading detection for navigation (smart loading system)
    const loadingEvent = new CustomEvent('navigationStarted', { 
      detail: { reference: norm, isMobile } 
    });
    window.dispatchEvent(loadingEvent);
    
    if (isMobile) {
      // Mobile: Use internal history stack to avoid browser memory issues
      setMobileHistory(prev => {
        // Remove any forward history when navigating to a new location
        const currentHistory = prev.slice(0, mobileHistoryIndex + 1);
        const newHistory = [...currentHistory, norm];
        
        // Limit history to MAX_HISTORY_SIZE entries (keep most recent)
        const limitedHistory = newHistory.length > MAX_HISTORY_SIZE 
          ? newHistory.slice(newHistory.length - MAX_HISTORY_SIZE)
          : newHistory;
          
        console.log('📱 Mobile history updated:', limitedHistory, 'size:', limitedHistory.length);
        return limitedHistory;
      });
      setMobileHistoryIndex(prev => {
        const newIndex = Math.min(prev + 1, MAX_HISTORY_SIZE - 1);
        console.log('📱 Mobile history index:', newIndex);
        return newIndex;
      });
    } else {
      // Desktop: Use browser history with better state management
      if (norm && norm !== lastPushed.current) {
        window.history.pushState({ 
          ref: norm, 
          timestamp: Date.now(),
          type: 'verse-navigation' 
        }, '', `#${norm}`);
        lastPushed.current = norm;
        console.log('🖥️ Desktop history pushed:', norm, 'total entries:', window.history.length);
      }
    }
    
    scrollToVerse(norm);
    
    // Stop loading after navigation completes
    setTimeout(() => {
      const loadingCompleteEvent = new CustomEvent('navigationCompleted', { 
        detail: { reference: norm } 
      });
      window.dispatchEvent(loadingCompleteEvent);
    }, 300);
  };

  // Mobile: Handle internal back/forward
  const goBack = () => {
    console.log('🔙 goBack called - mobile:', isMobile, 'canGoBack:', canGoBack);
    if (isMobile) {
      if (mobileHistoryIndex > 0) {
        const newIndex = mobileHistoryIndex - 1;
        const targetRef = mobileHistory[newIndex];
        console.log('📱 Mobile back to:', targetRef, 'index:', newIndex, 'history length:', mobileHistory.length);
        setMobileHistoryIndex(newIndex);
        scrollToVerse(targetRef);
        return true;
      } else {
        console.log('📱 Cannot go back - at beginning of history');
        return false;
      }
    } else {
      // Desktop: Use browser back
      console.log('🖥️ Desktop browser back');
      window.history.back();
      return true;
    }
  };

  const goForward = () => {
    console.log('🔜 goForward called - mobile:', isMobile, 'canGoForward:', canGoForward);
    if (isMobile) {
      if (mobileHistoryIndex < mobileHistory.length - 1) {
        const newIndex = mobileHistoryIndex + 1;
        const targetRef = mobileHistory[newIndex];
        console.log('📱 Mobile forward to:', targetRef, 'index:', newIndex, 'history length:', mobileHistory.length);
        setMobileHistoryIndex(newIndex);
        scrollToVerse(targetRef);
        return true;
      } else {
        console.log('📱 Cannot go forward - at end of history');
        return false;
      }
    } else {
      // Desktop: Use browser forward
      console.log('🖥️ Desktop browser forward');
      window.history.forward();
      return true;
    }
  };

  const canGoBack = isMobile ? mobileHistoryIndex > 0 : window.history.length > 1;
  const canGoForward = isMobile ? mobileHistoryIndex < mobileHistory.length - 1 : true; // Desktop can always attempt forward
  
  // Debug logging for navigation state
  if (isMobile) {
    console.log('📱 Mobile Navigation state:', {
      historyLength: mobileHistory.length,
      currentIndex: mobileHistoryIndex,
      canGoBack,
      canGoForward,
      currentRef: mobileHistory[mobileHistoryIndex],
      recentHistory: mobileHistory.slice(-5) // Show last 5 entries
    });
  } else {
    console.log('🖥️ Desktop Navigation state:', {
      browserHistoryLength: window.history.length,
      canGoBack,
      canGoForward,
      currentHash: window.location.hash
    });
  }

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
      } else {
        console.log('🔙 Desktop popstate ignored - not a user navigation event');
      }
    };
    
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [scrollToVerse, isMobile]);

  return { 
    goTo, 
    goBack, 
    goForward, 
    canGoBack, 
    canGoForward 
  };
}