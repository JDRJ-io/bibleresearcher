
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { applyTheme, initTheme, getCurrentTheme, getAvailableThemes } from '@/utils/themeManager';
import { ThemeName } from '@/themes/tokens';
import { markDirty } from '@/hooks/useSessionState';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: ThemeName[];
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  ...props
}: ThemeProviderProps) {
  // initTheme already applies the theme, so no need to call applyTheme again in useEffect
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return initTheme(defaultTheme);
  });

  // Multi-tab sync: listen for theme changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bible-theme-optimized' && typeof e.newValue === 'string') {
        const newTheme = e.newValue as ThemeName;
        if (newTheme === 'light' || newTheme === 'dark') {
          setThemeState(newTheme);
          applyTheme(newTheme);
          console.log(`🎨 Theme synced from other tab: ${newTheme}`);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle theme changes
  const setTheme = useCallback((newTheme: ThemeName) => {
    try {
      applyTheme(newTheme);
      setThemeState(newTheme);
      markDirty();
      console.log(`🎨 Theme applied: ${newTheme}`);
    } catch (error) {
      console.error('Failed to apply theme:', error);
      // Fallback to dark theme
      applyTheme('dark');
      setThemeState('dark');
      markDirty();
    }
  }, []);

  const value: ThemeProviderState = {
    theme,
    setTheme,
    themes: getAvailableThemes(),
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

// Export theme utilities and types for component usage
export { applyTheme, getCurrentTheme, getAvailableThemes } from '@/utils/themeManager';
export type { ThemeName } from '@/themes/tokens';
