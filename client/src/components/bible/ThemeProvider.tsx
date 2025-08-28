
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { applyTheme, initTheme, getCurrentTheme, getAvailableThemes } from '@/utils/themeManager';
import { ThemeName } from '@/themes/registry';

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
  defaultTheme = 'light',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return initTheme(defaultTheme);
  });

  // Initialize theme on mount
  useEffect(() => {
    const currentTheme = getCurrentTheme();
    setThemeState(currentTheme);
    applyTheme(currentTheme);
  }, []);

  // Handle theme changes
  const setTheme = useCallback((newTheme: ThemeName) => {
    try {
      applyTheme(newTheme);
      setThemeState(newTheme);
      console.log(`🎨 Theme applied: ${newTheme}`);
    } catch (error) {
      console.error('Failed to apply theme:', error);
      // Fallback to light theme
      applyTheme('light');
      setThemeState('light');
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

// Export theme utilities for component usage
export { applyTheme, getCurrentTheme, getAvailableThemes } from '@/utils/themeManager';
export type { ThemeName };
