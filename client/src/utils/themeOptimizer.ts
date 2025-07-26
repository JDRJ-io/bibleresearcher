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

  // Optimized theme definitions with memory efficiency in mind
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
        '--highlight-bg': 'hsl(214, 100%, 97%)'
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
        '--highlight-bg': 'hsl(215, 27%, 32%)'
      }
    },
    {
      id: 'sepia',
      name: 'Sepia',
      priority: 'enhanced',
      memoryFootprint: 'medium',
      fontFamily: 'Crimson Text, Times New Roman, serif',
      variables: {
        '--bg-primary': 'hsl(45, 15%, 96%)',
        '--bg-secondary': 'hsl(42, 25%, 90%)',
        '--text-primary': 'hsl(20, 50%, 15%)',
        '--text-secondary': 'hsl(25, 35%, 35%)',
        '--border-color': 'hsl(30, 20%, 85%)',
        '--accent-color': 'hsl(25, 75%, 45%)',
        '--highlight-bg': 'hsl(40, 30%, 88%)'
      }
    },
    {
      id: 'midnight',
      name: 'Midnight',
      priority: 'enhanced',
      memoryFootprint: 'medium',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      variables: {
        '--bg-primary': 'hsl(220, 25%, 12%)',
        '--bg-secondary': 'hsl(220, 30%, 8%)',
        '--text-primary': 'hsl(213, 31%, 91%)',
        '--text-secondary': 'hsl(215, 20%, 65%)',
        '--border-color': 'hsl(215, 28%, 17%)',
        '--accent-color': 'hsl(45, 100%, 70%)',
        '--highlight-bg': 'hsl(220, 20%, 20%)'
      }
    },
    {
      id: 'forest',
      name: 'Forest',
      priority: 'premium',
      memoryFootprint: 'high',
      fontFamily: 'Source Sans Pro, Lato, sans-serif',
      variables: {
        '--bg-primary': 'hsl(150, 85%, 2%)',
        '--bg-secondary': 'hsl(145, 75%, 4%)',
        '--text-primary': 'hsl(45, 85%, 88%)',
        '--text-secondary': 'hsl(48, 65%, 72%)',
        '--border-color': 'hsl(135, 70%, 22%)',
        '--accent-color': 'hsl(40, 90%, 70%)',
        '--highlight-bg': 'hsl(140, 20%, 18%)'
      }
    },
    {
      id: 'cyber',
      name: 'Cyber',
      priority: 'premium',
      memoryFootprint: 'high',
      fontFamily: 'JetBrains Mono, Courier New, monospace',
      variables: {
        '--bg-primary': 'hsl(210, 100%, 1%)',
        '--bg-secondary': 'hsl(205, 95%, 2%)',
        '--text-primary': 'hsl(180, 100%, 85%)',
        '--text-secondary': 'hsl(185, 70%, 60%)',
        '--border-color': 'hsl(185, 30%, 25%)',
        '--accent-color': 'hsl(315, 70%, 70%)',
        '--highlight-bg': 'hsl(185, 40%, 18%)'
      }
    },
    {
      id: 'rainbow',
      name: 'Rainbow Aurora',
      priority: 'premium',
      memoryFootprint: 'high',
      fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
      variables: {
        '--bg-primary': 'hsl(245, 95%, 1%)',
        '--bg-secondary': 'hsl(240, 85%, 3%)',
        '--text-primary': 'hsl(50, 100%, 92%)',
        '--text-secondary': 'hsl(55, 80%, 75%)',
        '--border-color': 'hsl(285, 70%, 30%)',
        '--accent-color': 'hsl(320, 90%, 65%)',
        '--highlight-bg': 'hsl(265, 70%, 15%)'
      }
    },
    {
      id: 'aurora',
      name: 'Aurora Borealis',
      priority: 'premium',
      memoryFootprint: 'high',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      variables: {
        '--bg-primary': 'hsl(205, 45%, 11%)',
        '--bg-secondary': 'hsl(210, 40%, 8%)',
        '--text-primary': 'hsl(190, 60%, 92%)',
        '--text-secondary': 'hsl(195, 45%, 75%)',
        '--border-color': 'hsl(200, 50%, 30%)',
        '--accent-color': 'hsl(175, 85%, 65%)',
        '--highlight-bg': 'hsl(200, 40%, 18%)'
      }
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      priority: 'premium',
      memoryFootprint: 'high',
      fontFamily: 'JetBrains Mono, SF Mono, Monaco, Cascadia Code, monospace',
      variables: {
        '--bg-primary': '#0d0b24',
        '--bg-secondary': '#1d183f',
        '--text-primary': '#e5e5f7',
        '--text-secondary': '#c9c9e0',
        '--border-color': '#3a3475',
        '--accent-color': '#00ffe2',
        '--highlight-bg': 'rgba(25,19,71,0.65)'
      }
    },
    {
      id: 'meadow',
      name: 'Forest Meadow',
      priority: 'premium',
      memoryFootprint: 'high',
      fontFamily: 'Source Sans Pro, Lato, Helvetica Neue, sans-serif',
      variables: {
        '--bg-primary': '#c8e6ff',
        '--bg-secondary': '#9be7ff',
        '--text-primary': '#142410',
        '--text-secondary': '#2d4a1f',
        '--border-color': '#6c8b52',
        '--accent-color': '#0a8426',
        '--highlight-bg': 'rgba(220,245,219,.5)'
      }
    },
    {
      id: 'scroll',
      name: 'Ancient Scroll',
      priority: 'premium',
      memoryFootprint: 'medium',
      fontFamily: 'Georgia, serif',
      variables: {
        '--bg-primary': '#f6edcd',
        '--bg-secondary': '#e2d3ab',
        '--text-primary': '#3b2c1b',
        '--text-secondary': '#5d4a35',
        '--border-color': '#c6b58d',
        '--accent-color': '#8a5c00',
        '--highlight-bg': 'rgba(245,235,196,.75)'
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
    
    // Remove all possible theme classes efficiently
    this.themes.forEach(theme => {
      root.classList.remove(theme.id, `${theme.id}-mode`);
      body.classList.remove(theme.id, `${theme.id}-mode`);
    });
    
    // Also remove legacy theme classes
    const legacyThemes = ['light-mode', 'dark-mode', 'sepia-mode', 'parchment-mode', 
                         'forest-mode', 'aurora-mode', 'cyber-mode', 'rainbow-mode', 
                         'midnight-mode', 'electric-mode'];
    legacyThemes.forEach(className => {
      root.classList.remove(className);
      body.classList.remove(className);
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
      
      // Add theme class for CSS selectors (both variants for compatibility)
      root.classList.add(theme.id);
      body.classList.add(theme.id);
      body.classList.add(`${theme.id}-mode`);
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