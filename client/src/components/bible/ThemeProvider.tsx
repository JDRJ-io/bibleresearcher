import { createContext, useContext, useEffect, useState } from 'react';
import { useBodyClass } from '@/hooks/useBodyClass';

type Theme = 'light-mode' | 'dark-mode' | 'sepia-mode' | 'aurora-mode' | 'electric-mode' | 'fireworks-mode';

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
    { id: 'light-mode', name: 'Light' },
    { id: 'dark-mode', name: 'Dark' },
    { id: 'sepia-mode', name: 'Sepia' },
    { id: 'aurora-mode', name: 'Aurora' },
    { id: 'electric-mode', name: 'Electric' },
    { id: 'fireworks-mode', name: 'Fireworks' },
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
