// Expert's orientation hook using matchMedia
import { useEffect, useState } from 'react';

export function useOrientation() {
  const query = '(orientation: portrait)';
  const [portrait, setPortrait] = useState<boolean>(
    typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setPortrait(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return portrait ? 'portrait' : 'landscape';
}