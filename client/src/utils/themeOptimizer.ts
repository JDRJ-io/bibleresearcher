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

  // Comprehensive theme definitions - all themes from Theme Pack v1
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
        '--text-secondary': 'hsl(215, 16%, 47%)',
        '--border-color': 'hsl(214, 32%, 91%)',
        '--accent-color': 'hsl(221, 83%, 53%)',
        '--highlight-bg': 'hsl(214, 100%, 97%)',
        '--hover-bg': 'hsl(210, 40%, 98%)'
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
        '--hover-bg': 'hsl(215, 20%, 15%)'
      }
    },
    {
      id: 'voodoo-blue',
      name: 'Voodoo Blue',
      priority: 'enhanced',
      memoryFootprint: 'medium',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      variables: {
        '--bg-primary': 'hsl(220, 30%, 11%)',
        '--bg-secondary': 'hsl(220, 26%, 16%)',
        '--text-primary': 'hsl(210, 15%, 92%)',
        '--text-secondary': 'hsl(210, 15%, 75%)',
        '--border-color': 'hsl(220, 26%, 20%)',
        '--accent-color': 'hsl(195, 78%, 52%)',
        '--highlight-bg': 'hsl(220, 26%, 20%)',
        '--hover-bg': 'hsl(220, 26%, 18%)'
      }
    },
    {
      id: 'midnight',
      name: 'Midnight',
      priority: 'enhanced',
      memoryFootprint: 'medium',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      variables: {
        '--bg-primary': 'hsl(228, 28%, 10%)',
        '--bg-secondary': 'hsl(228, 24%, 15%)',
        '--text-primary': 'hsl(220, 14%, 90%)',
        '--text-secondary': 'hsl(220, 14%, 70%)',
        '--border-color': 'hsl(228, 24%, 18%)',
        '--accent-color': 'hsl(265, 70%, 62%)',
        '--highlight-bg': 'hsl(228, 24%, 18%)',
        '--hover-bg': 'hsl(228, 24%, 16%)'
      }
    },
    {
      id: 'sepia',
      name: 'Sepia',
      priority: 'enhanced',
      memoryFootprint: 'medium',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      variables: {
        '--bg-primary': 'hsl(34, 40%, 92%)',
        '--bg-secondary': 'hsl(34, 35%, 86%)',
        '--text-primary': 'hsl(28, 30%, 18%)',
        '--text-secondary': 'hsl(28, 30%, 35%)',
        '--border-color': 'hsl(34, 35%, 80%)',
        '--accent-color': 'hsl(22, 70%, 44%)',
        '--highlight-bg': 'hsl(34, 35%, 88%)',
        '--hover-bg': 'hsl(34, 35%, 84%)'
      }
    },
    {
      id: 'sunset',
      name: 'Sunset',
      priority: 'enhanced',
      memoryFootprint: 'medium',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      variables: {
        '--bg-primary': 'hsl(20, 80%, 90%)',
        '--bg-secondary': 'hsl(18, 70%, 86%)',
        '--text-primary': 'hsl(12, 25%, 18%)',
        '--text-secondary': 'hsl(12, 25%, 35%)',
        '--border-color': 'hsl(18, 70%, 82%)',
        '--accent-color': 'hsl(12, 80%, 54%)',
        '--highlight-bg': 'hsl(18, 70%, 88%)',
        '--hover-bg': 'hsl(18, 70%, 84%)'
      }
    },
    {
      id: 'eden',
      name: 'Eden',
      priority: 'enhanced',
      memoryFootprint: 'medium',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      variables: {
        '--bg-primary': 'hsl(145, 30%, 94%)',
        '--bg-secondary': 'hsl(148, 28%, 88%)',
        '--text-primary': 'hsl(150, 20%, 18%)',
        '--text-secondary': 'hsl(150, 20%, 35%)',
        '--border-color': 'hsl(148, 28%, 82%)',
        '--accent-color': 'hsl(160, 55%, 42%)',
        '--highlight-bg': 'hsl(148, 28%, 90%)',
        '--hover-bg': 'hsl(148, 28%, 86%)'
      }
    },
    {
      id: 'royal',
      name: 'Royal',
      priority: 'premium',
      memoryFootprint: 'high',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      variables: {
        '--bg-primary': 'hsl(262, 30%, 12%)',
        '--bg-secondary': 'hsl(264, 26%, 18%)',
        '--text-primary': 'hsl(280, 15%, 92%)',
        '--text-secondary': 'hsl(280, 15%, 75%)',
        '--border-color': 'hsl(264, 26%, 22%)',
        '--accent-color': 'hsl(285, 70%, 58%)',
        '--highlight-bg': 'hsl(264, 26%, 22%)',
        '--hover-bg': 'hsl(264, 26%, 20%)'
      }
    },
    {
      id: 'hologram',
      name: 'Hologram',
      priority: 'premium',
      memoryFootprint: 'high',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      variables: {
        '--bg-primary': 'hsl(210, 30%, 9%)',
        '--bg-secondary': 'hsl(210, 28%, 14%)',
        '--text-primary': 'hsl(0, 0%, 98%)',
        '--text-secondary': 'hsl(0, 0%, 85%)',
        '--border-color': 'hsl(210, 28%, 18%)',
        '--accent-color': 'hsl(195, 100%, 70%)',
        '--highlight-bg': 'hsl(210, 28%, 18%)',
        '--hover-bg': 'hsl(210, 28%, 16%)'
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
    
    // Remove data-theme attribute
    root.removeAttribute('data-theme');
  }

  private applyThemeVariables(theme: OptimizedTheme): void {
    const root = document.documentElement;
    
    console.log(`🔍 THEME TRACKER: Applying theme variables for '${theme.id}'`);
    console.log(`🔍 THEME TRACKER: Theme variables:`, theme.variables);
    
    // Use data-theme attribute instead of classes (expert recommendation)
    root.setAttribute('data-theme', theme.id);
    
    console.log(`🔍 THEME TRACKER: Set data-theme="${theme.id}" on HTML element`);
    
    // Apply CSS variables immediately
    Object.entries(theme.variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
      this.cssVariableCache.set(property, value);
      console.log(`🔍 THEME TRACKER: Set ${property} = ${value}`);
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