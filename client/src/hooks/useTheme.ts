import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'rainbow';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    // Get initial theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = savedTheme || 'light';
    setThemeState(initialTheme);
    
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark', 'rainbow');
    document.documentElement.classList.add(initialTheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Remove all theme classes first
    document.documentElement.classList.remove('light', 'dark', 'rainbow');
    
    // Add the new theme class
    document.documentElement.classList.add(newTheme);
  };

  return { theme, setTheme };
}