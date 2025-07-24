
import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'sepia' | 'ocean' | 'forest' | 'sunset' | 'lavender' | 'midnight' | 'parchment' | 'emerald' | 'royal' | 'copper';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Array<{ id: Theme; name: string; description: string; }>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes = [
  { id: 'light' as Theme, name: 'Classic Light', description: 'Clean and bright for day reading' },
  { id: 'dark' as Theme, name: 'Dark Mode', description: 'Easy on the eyes for night reading' },
  { id: 'sepia' as Theme, name: 'Vintage Sepia', description: 'Warm, paper-like feel' },
  { id: 'ocean' as Theme, name: 'Ocean Breeze', description: 'Calming blues and teals' },
  { id: 'forest' as Theme, name: 'Forest Sanctuary', description: 'Natural greens and earth tones' },
  { id: 'sunset' as Theme, name: 'Golden Sunset', description: 'Warm oranges and deep purples' },
  { id: 'lavender' as Theme, name: 'Lavender Fields', description: 'Soft purples and gentle grays' },
  { id: 'midnight' as Theme, name: 'Midnight Study', description: 'Deep blues with silver accents' },
  { id: 'parchment' as Theme, name: 'Ancient Parchment', description: 'Aged paper with rich browns' },
  { id: 'emerald' as Theme, name: 'Emerald Wisdom', description: 'Rich greens with gold highlights' },
  { id: 'royal' as Theme, name: 'Royal Purple', description: 'Regal purples with cream accents' },
  { id: 'copper' as Theme, name: 'Copper Scroll', description: 'Warm coppers and deep burgundy' },
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
    
    // Remove all theme classes
    themes.forEach(t => root.classList.remove(t.id));
    
    // Add current theme class
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem('anointed-theme', theme);
    
    console.log(`🎨 Theme switched to: ${theme}`);
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
