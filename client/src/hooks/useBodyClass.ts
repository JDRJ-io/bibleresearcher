import { useEffect } from 'react';

export function useBodyClass(className: string, condition: boolean = true) {
  useEffect(() => {
    if (!condition) return;
    
    document.body.classList.add(className);
    return () => document.body.classList.remove(className);
  }, [className, condition]);
}