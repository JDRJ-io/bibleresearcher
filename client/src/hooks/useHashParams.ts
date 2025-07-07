import { useCallback, useEffect, useState } from 'react';

export function useHashParams() {
  const [hashParams, setHashParams] = useState<Record<string, string>>({});
  
  const updateHashParams = useCallback((params: Record<string, string>) => {
    const hashString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    window.location.hash = hashString;
    setHashParams(params);
  }, []);
  
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.slice(1);
      const params: Record<string, string> = {};
      
      if (hash) {
        hash.split('&').forEach(param => {
          const [key, value] = param.split('=');
          if (key && value) {
            params[key] = decodeURIComponent(value);
          }
        });
      }
      
      setHashParams(params);
    };
    
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);
  
  return { hashParams, updateHashParams };
}