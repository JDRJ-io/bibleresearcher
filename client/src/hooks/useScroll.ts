import { useRef, useEffect, useState } from 'react';

export function useScroll() {
  const [params, setParams] = useState<{ scrollTop: number; viewportHeight: number }>({
    scrollTop: 0,
    viewportHeight: 0
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const elem = containerRef.current;
    if (!elem) return;
    
    const handleScroll = () => {
      setParams({
        scrollTop: elem.scrollTop,
        viewportHeight: elem.clientHeight
      });
      
      // Dispatch custom event for patch notes banner scroll detection
      window.dispatchEvent(new CustomEvent('virtualTableScroll', {
        detail: { scrollTop: elem.scrollTop, viewportHeight: elem.clientHeight }
      }));
    };
    
    elem.addEventListener('scroll', handleScroll);
    handleScroll(); // Initialize
    
    return () => elem.removeEventListener('scroll', handleScroll);
  }, []);
  
  return { containerRef, params };
}