
import { createContext, useContext, useEffect, useState } from 'react';
import { useBodyClass } from '@/hooks/useBodyClass';

type Theme = 'light-mode' | 'dark-mode' | 'sepia-mode' | 'parchment-mode' | 'forest-mode' | 'aurora-mode' | 'cyber-mode' | 'rainbow-mode' | 'midnight-mode' | 'electric-mode';

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
    { id: 'parchment-mode', name: 'Parchment' },
    { id: 'forest-mode', name: 'Forest' },
    { id: 'aurora-mode', name: 'Aurora' },
    { id: 'cyber-mode', name: 'Cyber' },
    { id: 'rainbow-mode', name: 'Rainbow' },
    { id: 'midnight-mode', name: 'Midnight' },
    { id: 'electric-mode', name: 'Electric' },
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

  // Apply theme to both body class and root CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Remove all theme classes from both root and body
    initialState.themes.forEach(t => {
      root.classList.remove(t.id);
      body.classList.remove(t.id);
      // Also remove the root CSS variable versions
      root.classList.remove(t.id.replace('-mode', ''));
    });
    
    // Add current theme class to both root and body
    root.classList.add(theme);
    body.classList.add(theme);
    // Also add the root CSS variable version
    root.classList.add(theme.replace('-mode', ''));
    
    console.log(`🎨 Theme applied: ${theme} to root and body`);
  }, [theme]);

  // Use the useBodyClass hook as backup
  useBodyClass(theme);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
      console.log(`🎨 Theme changed to: ${theme}`);
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
