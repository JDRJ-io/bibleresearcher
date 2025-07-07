import { useRef, useEffect } from 'react';

export function useElement(theme: string) {
  const element = useRef<HTMLElement>(null);
  useEffect(() => {
    const elem = element.current;
    if (!elem) return;
    
    const observer = new MutationObserver(() => {
      // Purge DOM pokes
      elem.classList.remove(theme);
      elem.classList.add(theme);
    });
    
    observer.observe(elem, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, [theme]);
  
  return element;
}