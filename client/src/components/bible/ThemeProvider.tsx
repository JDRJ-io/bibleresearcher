
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { themeManager, OptimizedTheme } from '@/utils/themeOptimizer';

type ThemeId = 'light' | 'dark';

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
      console.log(`🔍 THEME TRACKER: Starting theme change from '${theme}' to '${newTheme}'`);
      
      // Track what happens in the DOM
      const htmlElement = document.documentElement;
      const bodyElement = document.body;
      
      console.log(`🔍 THEME TRACKER: Before change - HTML classes: "${htmlElement.className}"`);
      console.log(`🔍 THEME TRACKER: Before change - Body classes: "${bodyElement.className}"`);
      console.log(`🔍 THEME TRACKER: Before change - Body style: background="${bodyElement.style.background}", backgroundColor="${bodyElement.style.backgroundColor}"`);
      
      // Performance-conscious theme switching
      if (enablePerformanceMode) {
        console.log(`🔍 THEME TRACKER: Applying minimal theme for '${newTheme}'`);
        themeManager.applyMinimalTheme(newTheme);
      } else {
        console.log(`🔍 THEME TRACKER: Applying full theme for '${newTheme}'`);
        themeManager.applyTheme(newTheme);
      }
      
      // Track what changed in the DOM
      setTimeout(() => {
        console.log(`🔍 THEME TRACKER: After change - HTML classes: "${htmlElement.className}"`);
        console.log(`🔍 THEME TRACKER: After change - Body classes: "${bodyElement.className}"`);
        console.log(`🔍 THEME TRACKER: After change - Body style: background="${bodyElement.style.background}", backgroundColor="${bodyElement.style.backgroundColor}"`);
        
        // Check CSS variables
        const computedStyle = getComputedStyle(htmlElement);
        console.log(`🔍 THEME TRACKER: CSS Variables after change:`, {
          '--bg-primary': computedStyle.getPropertyValue('--bg-primary'),
          '--bg-secondary': computedStyle.getPropertyValue('--bg-secondary'),
          '--text-primary': computedStyle.getPropertyValue('--text-primary'),
          '--text-secondary': computedStyle.getPropertyValue('--text-secondary'),
          '--border-color': computedStyle.getPropertyValue('--border-color'),
          '--accent-color': computedStyle.getPropertyValue('--accent-color')
        });
      }, 50);
      
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
