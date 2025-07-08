import { useEffect } from 'react';

export function useBodyClass(className: string | null, condition: boolean = true) {
  useEffect(() => {
    if (!condition || !className || className.trim() === '') return;
    
    document.body.classList.add(className);
    return () => document.body.classList.remove(className);
  }, [className, condition]);
}