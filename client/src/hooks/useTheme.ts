import { useState, useEffect } from 'react';

export type Theme = 'light';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    // Always use light theme
    setThemeState('light');
    
    // Ensure light theme is applied to document
    document.documentElement.classList.remove('dark');
  }, []);

  const setTheme = (newTheme: Theme) => {
    // Only light theme is supported
    setThemeState('light');
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
  };

  return { theme, setTheme };
}