/**
 * Theme Performance Optimizer
 * Manages memory-efficient theme switching and CSS variable optimization
 */

export interface OptimizedTheme {
  id: string;
  name: string;
  variables: Record<string, string>;
  fontFamily: string;
  priority: 'essential' | 'enhanced' | 'premium';
  memoryFootprint: 'low' | 'medium' | 'high';
}

export class ThemeManager {
  private static instance: ThemeManager;
  private appliedTheme: string | null = null;
  private cssVariableCache = new Map<string, string>();
  private performanceMonitor = {
    themeChanges: 0,
    lastChangeTime: 0,
    memoryUsage: 0
  };

  // Theme definitions - light, dark, and blue
  private themes: OptimizedTheme[] = [
    {
      id: 'light',
      name: 'Light',
      priority: 'essential',
      memoryFootprint: 'low',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      variables: {
        '--bg-primary': 'hsl(0, 0%, 100%)',
        '--bg-secondary': 'hsl(210, 40%, 98%)',
        '--text-primary': 'hsl(210, 24%, 16%)',
        '--text-secondary': 'hsl(215, 20%, 35%)',
        '--border-color': 'hsl(214, 32%, 91%)',
        '--accent-color': 'hsl(221, 83%, 53%)',
        '--highlight-bg': 'hsl(214, 100%, 97%)',
        '--use-transparent-bg': 'false'
      }
    },
    {
      id: 'dark',
      name: 'Dark',
      priority: 'essential',
      memoryFootprint: 'low',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      variables: {
        '--bg-primary': 'hsl(222, 20%, 11%)',
        '--bg-secondary': 'hsl(222, 15%, 8%)',
        '--text-primary': 'hsl(213, 31%, 91%)',
        '--text-secondary': 'hsl(215, 20%, 65%)',
        '--border-color': 'hsl(217, 33%, 17%)',
        '--accent-color': 'hsl(217, 91%, 65%)',
        '--highlight-bg': 'hsl(215, 27%, 32%)',
        '--use-transparent-bg': 'false'
      }
    },
    {
      id: 'blue',
      name: 'Blue Ocean',
      priority: 'enhanced',
      memoryFootprint: 'medium',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      variables: {
        '--bg-primary': 'hsl(210, 100%, 95%)',
        '--bg-secondary': 'hsl(210, 100%, 92%)',
        '--text-primary': 'hsl(210, 100%, 15%)',
        '--text-secondary': 'hsl(210, 60%, 25%)',
        '--border-color': 'hsl(210, 80%, 85%)',
        '--accent-color': 'hsl(210, 100%, 50%)',
        '--highlight-bg': 'hsl(210, 100%, 88%)',
        '--use-transparent-bg': 'true',
        '--theme-bg-gradient': 'linear-gradient(135deg, hsl(210, 100%, 50%) 0%, hsl(220, 100%, 40%) 50%, hsl(230, 100%, 30%) 100%)'
      }
    }
  ];

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  getThemes(): OptimizedTheme[] {
    return this.themes;
  }

  getEssentialThemes(): OptimizedTheme[] {
    return this.themes.filter(theme => theme.priority === 'essential');
  }

  applyTheme(themeId: string): void {
    const theme = this.themes.find(t => t.id === themeId);
    if (!theme) {
      console.warn(`Theme ${themeId} not found`);
      return;
    }

    const startTime = performance.now();
    
    // Clear previous theme efficiently
    this.clearCurrentTheme();
    
    // Apply new theme variables in batch
    this.applyThemeVariables(theme);
    
    // Set font family efficiently
    this.applyFontFamily(theme.fontFamily);
    
    // Update state
    this.appliedTheme = themeId;
    
    // Performance monitoring
    const endTime = performance.now();
    this.performanceMonitor.themeChanges++;
    this.performanceMonitor.lastChangeTime = endTime - startTime;
    
    console.log(`🎨 Theme '${theme.name}' applied in ${(endTime - startTime).toFixed(2)}ms`);
    
    // Memory cleanup for high-footprint themes
    if (theme.memoryFootprint === 'high') {
      this.scheduleMemoryCleanup();
    }
  }

  private clearCurrentTheme(): void {
    if (!this.appliedTheme) return;
    
    const root = document.documentElement;
    const body = document.body;
    
    // Remove theme classes efficiently
    this.themes.forEach(theme => {
      root.classList.remove(theme.id, `${theme.id}-mode`);
      body.classList.remove(theme.id, `${theme.id}-mode`);
    });
  }

  private applyThemeVariables(theme: OptimizedTheme): void {
    const root = document.documentElement;
    const body = document.body;
    
    // Batch CSS variable updates
    requestAnimationFrame(() => {
      Object.entries(theme.variables).forEach(([property, value]) => {
        root.style.setProperty(property, value);
        this.cssVariableCache.set(property, value);
      });
      
      // Handle background transparency for other themes
      const useTransparentBg = theme.variables['--use-transparent-bg'] === 'true';
      if (useTransparentBg) {
        // Make light/dark backgrounds invisible
        root.classList.add('transparent-mode');
        body.classList.add('transparent-mode');
        
        // Apply theme gradient if available
        if (theme.variables['--theme-bg-gradient']) {
          body.style.background = theme.variables['--theme-bg-gradient'];
        }
      } else {
        // Remove transparent mode
        root.classList.remove('transparent-mode');
        body.classList.remove('transparent-mode');
        body.style.background = '';
      }
      
      // Add theme class for CSS selectors
      root.classList.add(theme.id);
      body.classList.add(theme.id);
    });
  }

  private applyFontFamily(fontFamily: string): void {
    document.documentElement.style.setProperty('--font-family', fontFamily);
  }

  private scheduleMemoryCleanup(): void {
    // Cleanup unused CSS variables after theme change
    setTimeout(() => {
      this.cleanupUnusedVariables();
    }, 1000);
  }

  private cleanupUnusedVariables(): void {
    const root = document.documentElement;
    const appliedTheme = this.themes.find(t => t.id === this.appliedTheme);
    
    if (!appliedTheme) return;
    
    // Remove CSS variables not used by current theme
    this.cssVariableCache.forEach((value, property) => {
      if (!appliedTheme.variables[property]) {
        root.style.removeProperty(property);
        this.cssVariableCache.delete(property);
      }
    });
  }

  getCurrentTheme(): string | null {
    return this.appliedTheme;
  }

  getPerformanceMetrics() {
    return {
      ...this.performanceMonitor,
      cacheSize: this.cssVariableCache.size,
      memoryEstimate: this.estimateMemoryUsage()
    };
  }

  private estimateMemoryUsage(): number {
    // Rough estimate of memory usage in KB
    const variableCount = this.cssVariableCache.size;
    const themeCount = this.themes.length;
    return (variableCount * 50 + themeCount * 100) / 1024; // Convert to KB
  }

  // Preload essential themes for faster switching
  preloadEssentialThemes(): void {
    this.getEssentialThemes().forEach(theme => {
      // Cache essential theme variables
      Object.entries(theme.variables).forEach(([property, value]) => {
        this.cssVariableCache.set(`${theme.id}-${property}`, value);
      });
    });
  }

  // Memory-conscious theme switching for low-end devices
  applyMinimalTheme(themeId: string): void {
    const theme = this.themes.find(t => t.id === themeId);
    if (!theme || theme.priority === 'premium') {
      // Fallback to essential theme for performance
      this.applyTheme('light');
      return;
    }
    this.applyTheme(themeId);
  }
}

// Global instance
export const themeManager = ThemeManager.getInstance();