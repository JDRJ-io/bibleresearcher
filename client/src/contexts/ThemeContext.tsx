import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'sepia' | 'fireworks' | 'aurora';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Array<{ id: Theme; name: string; }>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes = [
  { id: 'light' as Theme, name: 'Light' },
  { id: 'dark' as Theme, name: 'Dark' },
  { id: 'sepia' as Theme, name: 'Sepia' },
  { id: 'fireworks' as Theme, name: 'Fireworks' },
  { id: 'aurora' as Theme, name: 'Aurora' },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('anointed-theme') as Theme;
    if (savedTheme && themes.find(t => t.id === savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    const body = document.body;
    
    // Remove all theme classes from both root and body
    themes.forEach(t => {
      root.classList.remove(t.id);
      body.classList.remove(t.id);
      // Also remove -mode versions for compatibility
      root.classList.remove(t.id + '-mode');
      body.classList.remove(t.id + '-mode');
    });
    
    // Add current theme class to both root and body
    root.classList.add(theme);
    body.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem('anointed-theme', theme);
    
    console.log(`🎨 Theme switched to: ${theme}`);
    console.log(`🎨 Applied theme classes to root and body: ${theme}`);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}