import { useEffect } from 'react';

export function useDebouncedEffect(
  callback: () => void,
  deps: React.DependencyList,
  delay: number
) {
  useEffect(() => {
    const timer = setTimeout(callback, delay);
    return () => clearTimeout(timer);
  }, deps);
}