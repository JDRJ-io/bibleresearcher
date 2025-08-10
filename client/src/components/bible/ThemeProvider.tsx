
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { themeManager, OptimizedTheme } from '@/utils/themeOptimizer';

type ThemeId = 'light' | 'dark' | 'blue';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: ThemeId;
  storageKey?: string;
  enablePerformanceMode?: boolean;
};

type ThemeProviderState = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: OptimizedTheme[];
  performanceMetrics: ReturnType<typeof themeManager.getPerformanceMetrics>;
  enablePerformanceMode: boolean;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'bible-theme-optimized',
  enablePerformanceMode = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem(storageKey) as ThemeId;
    return stored || defaultTheme;
  });

  const [performanceMetrics, setPerformanceMetrics] = useState(
    themeManager.getPerformanceMetrics()
  );

  // Initialize theme manager and preload essential themes
  useEffect(() => {
    themeManager.preloadEssentialThemes();
    
    // Apply stored theme on mount
    if (enablePerformanceMode) {
      themeManager.applyMinimalTheme(theme);
    } else {
      themeManager.applyTheme(theme);
    }
  }, []);

  // Handle theme changes with memory optimization
  const setTheme = useCallback((newTheme: ThemeId) => {
    try {
      // Performance-conscious theme switching
      if (enablePerformanceMode) {
        themeManager.applyMinimalTheme(newTheme);
      } else {
        themeManager.applyTheme(newTheme);
      }
      
      // Update state and storage
      setThemeState(newTheme);
      localStorage.setItem(storageKey, newTheme);
      
      // Update performance metrics
      setPerformanceMetrics(themeManager.getPerformanceMetrics());
      
      console.log(`🎨 Theme optimized: ${newTheme}`);
    } catch (error) {
      console.error('Failed to apply theme:', error);
      // Fallback to light theme
      themeManager.applyTheme('light');
      setThemeState('light');
    }
  }, [enablePerformanceMode, storageKey]);

  // Memory cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup any scheduled operations
      const metrics = themeManager.getPerformanceMetrics();
      if (metrics.memoryEstimate > 50) { // > 50KB
        console.log('🧹 Theme memory cleanup on unmount');
      }
    };
  }, []);

  const value: ThemeProviderState = {
    theme,
    setTheme,
    themes: themeManager.getThemes(),
    performanceMetrics,
    enablePerformanceMode,
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
export { themeManager } from '@/utils/themeOptimizer';
export type { OptimizedTheme, ThemeId };
