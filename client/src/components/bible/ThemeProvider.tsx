import { createContext, useContext, useEffect, useState } from 'react';
import { useBodyClass } from '@/hooks/useBodyClass';

type Theme = 'light-mode' | 'dark-mode' | 'sepia-mode' | 'aurora-mode' | 'fireworks-mode' | 'rainbow-mode' | 'cyber-mode' | 'forest-mode' | 'ocean-mode';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Array<{ id: Theme; name: string }>;
};

const initialState: ThemeProviderState = {
  theme: 'light-mode',
  setTheme: () => null,
  themes: [
    { id: 'light-mode', name: 'Classic Light' },
    { id: 'dark-mode', name: 'Midnight Study' },
    { id: 'sepia-mode', name: 'Parchment Scholar' },
    { id: 'aurora-mode', name: 'Northern Lights' },
    { id: 'fireworks-mode', name: 'Celebration' },
    { id: 'rainbow-mode', name: 'Dark Rainbow' },
    { id: 'cyber-mode', name: 'Cyber Matrix' },
    { id: 'forest-mode', name: 'Forest Study' },
    { id: 'ocean-mode', name: 'Ocean Depths' },
  ],
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'light-mode',
  storageKey = 'bible-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  // Use the new useBodyClass hook instead of direct DOM manipulation
  useBodyClass(theme);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    themes: initialState.themes,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
