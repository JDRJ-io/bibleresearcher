import { useCallback, useRef } from 'react';

export function useFocusScroller() {
  const nodeRef = useRef<HTMLElement | null>(null);
  
  const onFocus = useCallback((e: Event) => {
    const el = e.target as HTMLElement;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
      return;
    }
    
    // Give OSK a beat to appear, then center the field without resizing anything
    setTimeout(() => {
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    }, 100);
  }, []);
  
  // Callback ref that React calls whenever the element mounts/unmounts/changes
  const callbackRef = useCallback((element: HTMLElement | null) => {
    // Remove listener from old element
    if (nodeRef.current) {
      nodeRef.current.removeEventListener('focusin', onFocus);
    }
    
    // Store new element and attach listener
    nodeRef.current = element;
    if (element) {
      element.addEventListener('focusin', onFocus);
    }
  }, [onFocus]);
  
  return callbackRef;
}
