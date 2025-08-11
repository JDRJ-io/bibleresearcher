// Memory Management System for Biblical Research Platform
// Critical memory optimization to prevent application crashes

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
  isLowMemory: boolean;
  isCritical: boolean;
}

interface MemoryThresholds {
  warning: number;    // 70% - Start cleanup warnings
  critical: number;   // 85% - Force aggressive cleanup
  emergency: number;  // 95% - Emergency shutdown procedures
}

const THRESHOLDS: MemoryThresholds = {
  warning: 0.70,
  critical: 0.85,
  emergency: 0.95
};

class MemoryManager {
  private static instance: MemoryManager;
  private intervalId: number | null = null;
  private callbacks: Map<string, (metrics: MemoryMetrics) => void> = new Map();
  private lastMetrics: MemoryMetrics | null = null;
  private emergencyMode = false;

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  getMemoryMetrics(): MemoryMetrics {
    if (!(performance as any).memory) {
      // Fallback for browsers without memory API
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 1024 * 1024 * 1024, // Assume 1GB
        usagePercentage: 0,
        isLowMemory: false,
        isCritical: false
      };
    }

    const memory = (performance as any).memory;
    const usagePercentage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage,
      isLowMemory: usagePercentage > THRESHOLDS.warning,
      isCritical: usagePercentage > THRESHOLDS.critical
    };
  }

  private startMonitoring() {
    // Check memory every 5 seconds
    this.intervalId = window.setInterval(() => {
      const metrics = this.getMemoryMetrics();
      this.lastMetrics = metrics;

      // Trigger callbacks based on thresholds
      if (metrics.usagePercentage > THRESHOLDS.emergency && !this.emergencyMode) {
        console.error('🚨 EMERGENCY: Memory usage exceeds 95%! Triggering emergency cleanup...');
        this.triggerEmergencyCleanup();
      } else if (metrics.usagePercentage > THRESHOLDS.critical) {
        console.warn('⚠️ CRITICAL: Memory usage exceeds 85%! Triggering aggressive cleanup...');
        this.notifyCallbacks('critical', metrics);
      } else if (metrics.usagePercentage > THRESHOLDS.warning) {
        console.warn('📊 WARNING: Memory usage exceeds 70%. Starting memory optimization...');
        this.notifyCallbacks('warning', metrics);
      }

      // Log detailed metrics every 30 seconds or if usage is high
      const shouldLog = Date.now() % 30000 < 5000 || metrics.usagePercentage > THRESHOLDS.warning;
      if (shouldLog) {
        console.log('💾 Memory Status:', {
          used: `${Math.round(metrics.usedJSHeapSize / 1024 / 1024)}MB`,
          limit: `${Math.round(metrics.jsHeapSizeLimit / 1024 / 1024)}MB`,
          percentage: `${Math.round(metrics.usagePercentage * 100)}%`,
          status: this.getMemoryStatus(metrics)
        });
      }
    }, 5000);
  }

  private getMemoryStatus(metrics: MemoryMetrics): string {
    if (metrics.usagePercentage > THRESHOLDS.emergency) return 'EMERGENCY';
    if (metrics.usagePercentage > THRESHOLDS.critical) return 'CRITICAL';
    if (metrics.usagePercentage > THRESHOLDS.warning) return 'WARNING';
    return 'NORMAL';
  }

  private notifyCallbacks(level: string, metrics: MemoryMetrics) {
    this.callbacks.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Memory callback error:', error);
      }
    });
  }

  private triggerEmergencyCleanup() {
    this.emergencyMode = true;
    
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }

    // Clear all caches
    this.clearAllCaches();
    
    // Terminate workers
    this.terminateWorkers();

    // Clear URL cache (for blob URLs)
    this.clearUrlCache();

    console.error('🚨 Emergency cleanup completed. Monitoring for recovery...');
    
    // Reset emergency mode after 30 seconds
    setTimeout(() => {
      this.emergencyMode = false;
      console.log('📊 Emergency mode reset. Resume normal operation.');
    }, 30000);
  }

  private clearAllCaches() {
    try {
      // Clear master cache
      const { masterCache } = require('@/lib/supabaseClient');
      if (masterCache && typeof masterCache.clear === 'function') {
        masterCache.clear();
        console.log('🗑️ Master cache cleared');
      }

      // Clear browser caches
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
          });
          console.log('🗑️ Browser caches cleared');
        });
      }
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }

  private terminateWorkers() {
    // This will be called by components that manage workers
    window.dispatchEvent(new CustomEvent('memory-emergency-terminate-workers'));
    console.log('🔄 Worker termination signal sent');
  }

  private clearUrlCache() {
    // Clear any blob URLs that might be hanging around
    window.dispatchEvent(new CustomEvent('memory-clear-blob-urls'));
  }

  // Public API for components to register for memory warnings
  onMemoryWarning(id: string, callback: (metrics: MemoryMetrics) => void) {
    this.callbacks.set(id, callback);
    return () => this.callbacks.delete(id);
  }

  // Get current memory status for components to check
  getCurrentStatus(): MemoryMetrics | null {
    return this.lastMetrics;
  }

  // Manual cleanup trigger for components
  requestCleanup() {
    const metrics = this.getMemoryMetrics();
    if (metrics.usagePercentage > THRESHOLDS.warning) {
      this.notifyCallbacks('manual', metrics);
    }
  }

  // Check if we're in low memory mode
  isLowMemoryMode(): boolean {
    const metrics = this.getMemoryMetrics();
    return metrics.isLowMemory || this.emergencyMode;
  }

  // Device capability detection
  getDeviceCapabilities() {
    const deviceMemory = (navigator as any).deviceMemory || 4; // Default to 4GB
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType || '4g';
    
    return {
      deviceMemory,
      connectionType: effectiveType,
      isLowMemoryDevice: deviceMemory <= 4,
      isSlowConnection: effectiveType.includes('2g') || effectiveType === '3g'
    };
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.callbacks.clear();
  }
}

// Global memory manager instance
export const memoryManager = MemoryManager.getInstance();

// Utility hooks and functions
export function useMemoryMonitor(componentName: string) {
  const [memoryStatus, setMemoryStatus] = React.useState<MemoryMetrics | null>(null);
  
  React.useEffect(() => {
    const cleanup = memoryManager.onMemoryWarning(componentName, (metrics) => {
      setMemoryStatus(metrics);
      
      // Component-specific cleanup logic can be added here
      if (metrics.isCritical) {
        console.warn(`🧹 ${componentName} received critical memory warning`);
      }
    });

    return () => {
      cleanup();
    };
  }, [componentName]);

  return {
    memoryStatus,
    isLowMemory: memoryManager.isLowMemoryMode(),
    requestCleanup: () => memoryManager.requestCleanup(),
    deviceCapabilities: memoryManager.getDeviceCapabilities()
  };
}

// React import for hooks
import React from 'react';

// Buffer size recommendations based on memory status
export function getOptimalBufferSize(defaultSize: number = 100): number {
  const capabilities = memoryManager.getDeviceCapabilities();
  const currentStatus = memoryManager.getCurrentStatus();
  
  let multiplier = 1;
  
  // Adjust based on device capabilities
  if (capabilities.isLowMemoryDevice) multiplier *= 0.4;
  if (capabilities.isSlowConnection) multiplier *= 0.6;
  
  // Adjust based on current memory usage
  if (currentStatus) {
    if (currentStatus.usagePercentage > THRESHOLDS.critical) multiplier *= 0.3;
    else if (currentStatus.usagePercentage > THRESHOLDS.warning) multiplier *= 0.6;
  }
  
  return Math.max(10, Math.floor(defaultSize * multiplier));
}

export { THRESHOLDS };