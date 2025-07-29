import { useEffect, useRef, useState } from 'react';
import { getVerseKeys } from '@/lib/verseKeysLoader';
import { useMobileDetection } from './useMobileDetection';

type ScrollToFn = (ref: string) => void;

export function useVerseNav(scrollToVerse: ScrollToFn) {
  const verseKeys = getVerseKeys();
  const isMobile = useMobileDetection();
  const lastPushed = useRef<string | null>(null);
  
  // Mobile-only: internal navigation history stack
  const [mobileHistory, setMobileHistory] = useState<string[]>([]);
  const [mobileHistoryIndex, setMobileHistoryIndex] = useState(-1);

  // Call this when a link is clicked
  const goTo = (ref: string) => {
    const norm = ref.trim();
    console.log('🚀 useVerseNav goTo called with:', ref, 'normalized:', norm, 'mobile:', isMobile);
    
    if (isMobile) {
      // Mobile: Use internal history stack to avoid browser memory issues
      setMobileHistory(prev => {
        const newHistory = [...prev.slice(0, mobileHistoryIndex + 1), norm];
        console.log('📱 Mobile history updated:', newHistory);
        return newHistory;
      });
      setMobileHistoryIndex(prev => prev + 1);
    } else {
      // Desktop: Use browser history as before
      if (norm && norm !== lastPushed.current) {
        window.history.pushState({ ref: norm }, '', `#${norm}`);
        lastPushed.current = norm;
        console.log('🖥️ Desktop history pushed:', norm);
      }
    }
    
    scrollToVerse(norm);
  };

  // Mobile: Handle internal back/forward
  const goBack = () => {
    if (isMobile) {
      if (mobileHistoryIndex > 0) {
        const newIndex = mobileHistoryIndex - 1;
        const targetRef = mobileHistory[newIndex];
        console.log('📱 Mobile back to:', targetRef, 'index:', newIndex);
        setMobileHistoryIndex(newIndex);
        scrollToVerse(targetRef);
        return true;
      }
      return false;
    } else {
      // Desktop: Use browser back
      window.history.back();
      return true;
    }
  };

  const goForward = () => {
    if (isMobile) {
      if (mobileHistoryIndex < mobileHistory.length - 1) {
        const newIndex = mobileHistoryIndex + 1;
        const targetRef = mobileHistory[newIndex];
        console.log('📱 Mobile forward to:', targetRef, 'index:', newIndex);
        setMobileHistoryIndex(newIndex);
        scrollToVerse(targetRef);
        return true;
      }
      return false;
    } else {
      // Desktop: Use browser forward
      window.history.forward();
      return true;
    }
  };

  const canGoBack = isMobile ? mobileHistoryIndex > 0 : window.history.length > 1;
  const canGoForward = isMobile ? mobileHistoryIndex < mobileHistory.length - 1 : false;

  // Desktop only: Handle browser popstate events
  useEffect(() => {
    if (isMobile) return; // Skip browser history on mobile
    
    const onPop = (e: PopStateEvent) => {
      console.log('🔙 Desktop popstate triggered:', e.state);
      const ref = (e.state && e.state.ref) || window.location.hash.slice(1);
      if (ref) {
        console.log('🔙 Desktop navigating to:', ref);
        scrollToVerse(ref);
        lastPushed.current = ref;
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