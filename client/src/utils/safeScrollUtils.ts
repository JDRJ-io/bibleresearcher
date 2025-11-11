// Safe scroll utilities to prevent fighting user scroll input

let userScrollEndTimeout: NodeJS.Timeout | null = null;

// Track when user is actively scrolling to prevent programmatic interference
function setUserScrolling(el: HTMLElement, isScrolling: boolean) {
  el.dataset.userScroll = isScrolling ? '1' : '0';
}

// Set up user scroll tracking on an element
export function setupUserScrollTracking(el: HTMLElement) {
  const markUserScrolling = () => {
    setUserScrolling(el, true);
    
    // Clear existing timeout
    if (userScrollEndTimeout) {
      clearTimeout(userScrollEndTimeout);
    }
    
    // Mark as not scrolling after 120ms of inactivity
    userScrollEndTimeout = setTimeout(() => {
      setUserScrolling(el, false);
    }, 120);
  };

  // Listen for user scroll input events
  el.addEventListener('pointerdown', markUserScrolling);
  el.addEventListener('touchstart', markUserScrolling);
  el.addEventListener('wheel', markUserScrolling);
  
  return () => {
    el.removeEventListener('pointerdown', markUserScrolling);
    el.removeEventListener('touchstart', markUserScrolling);  
    el.removeEventListener('wheel', markUserScrolling);
    if (userScrollEndTimeout) {
      clearTimeout(userScrollEndTimeout);
    }
  };
}

// Safe scroll function that respects user input - works with both window and container elements
export function safeWriteScrollTop(
  el: HTMLElement | Window, 
  top: number, 
  behavior: ScrollBehavior = 'auto'
) {
  // Check user scroll state (only available on HTMLElement)
  if (el instanceof HTMLElement && el.dataset.userScroll === '1') {
    console.log('🚫 SAFE SCROLL: Skipping programmatic scroll during user input');
    return;
  }
  
  console.log('✅ SAFE SCROLL: Programmatic scroll allowed:', top);
  el.scrollTo({ top, behavior });
}

// Read-only center tracking helper
export function updateCenterIndex(el: HTMLElement, rowHeight: number) {
  const scrollCenter = el.scrollTop + el.clientHeight / 2;
  const centerIndex = Math.floor(scrollCenter / rowHeight);
  el.dataset.centerIndex = String(centerIndex);
  return centerIndex;
}