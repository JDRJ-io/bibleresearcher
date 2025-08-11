// Comprehensive memory optimization utilities for Biblical Research Platform

import { memoryManager } from '@/lib/memoryManager';

export interface MemoryOptimizedConfig {
  bufferSize: number;
  batchSize: number;
  renderDelay: number;
  enableVirtualization: boolean;
  maxConcurrentLoads: number;
  enableAnimations: boolean;
  debugLogging: boolean;
}

export function getOptimizedConfig(): MemoryOptimizedConfig {
  const capabilities = memoryManager.getDeviceCapabilities();
  const currentStatus = memoryManager.getCurrentStatus();
  const isLowMemory = memoryManager.isLowMemoryMode();
  
  // Base configuration for desktop
  let config: MemoryOptimizedConfig = {
    bufferSize: 100,
    batchSize: 20,
    renderDelay: 0,
    enableVirtualization: true,
    maxConcurrentLoads: 4,
    enableAnimations: true,
    debugLogging: false
  };

  // Device-based optimizations
  if (capabilities.isLowMemoryDevice) {
    config.bufferSize = 40;
    config.batchSize = 10;
    config.maxConcurrentLoads = 2;
    config.enableAnimations = false;
  }

  // Connection-based optimizations
  if (capabilities.isSlowConnection) {
    config.bufferSize = Math.min(config.bufferSize, 30);
    config.batchSize = Math.min(config.batchSize, 5);
    config.renderDelay = 100;
    config.maxConcurrentLoads = 1;
  }

  // Memory pressure optimizations
  if (currentStatus && isLowMemory) {
    const memoryPressure = currentStatus.usagePercentage;
    
    if (memoryPressure > 0.85) {
      // Critical memory - extreme optimization
      config.bufferSize = 15;
      config.batchSize = 3;
      config.renderDelay = 200;
      config.maxConcurrentLoads = 1;
      config.enableAnimations = false;
      config.debugLogging = true;
    } else if (memoryPressure > 0.70) {
      // High memory - aggressive optimization
      config.bufferSize = 25;
      config.batchSize = 5;
      config.renderDelay = 100;
      config.maxConcurrentLoads = 1;
      config.enableAnimations = false;
    }
  }

  // Mobile-specific adjustments
  if (window.innerWidth <= 768) {
    config.bufferSize = Math.min(config.bufferSize, 50);
    config.batchSize = Math.min(config.batchSize, 10);
    config.renderDelay = Math.max(config.renderDelay, 50);
  }

  return config;
}

// Memory-aware component cleanup utilities
export function createMemoryAwareCleanup() {
  const cleanupTasks: (() => void)[] = [];
  
  const addCleanupTask = (task: () => void) => {
    cleanupTasks.push(task);
  };
  
  const executeCleanup = () => {
    cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    });
    cleanupTasks.length = 0;
  };
  
  // Listen for memory pressure events
  const cleanup = memoryManager.onMemoryWarning('memory-cleanup', (metrics) => {
    if (metrics.isCritical) {
      console.log('🧹 Executing memory cleanup tasks due to critical memory pressure');
      executeCleanup();
    }
  });
  
  return {
    addCleanupTask,
    executeCleanup,
    destroy: cleanup
  };
}

// Progressive loading helper
export class ProgressiveLoader {
  private loadQueue: (() => Promise<void>)[] = [];
  private isLoading = false;
  private batchSize: number;
  private delay: number;
  
  constructor() {
    const config = getOptimizedConfig();
    this.batchSize = config.batchSize;
    this.delay = config.renderDelay;
  }
  
  addTask(task: () => Promise<void>) {
    this.loadQueue.push(task);
    this.processQueue();
  }
  
  private async processQueue() {
    if (this.isLoading || this.loadQueue.length === 0) return;
    
    this.isLoading = true;
    
    try {
      while (this.loadQueue.length > 0) {
        // Process batch
        const batch = this.loadQueue.splice(0, this.batchSize);
        await Promise.allSettled(batch.map(task => task()));
        
        // Memory-aware delay
        if (this.delay > 0 && this.loadQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delay));
        }
        
        // Check memory pressure
        const currentStatus = memoryManager.getCurrentStatus();
        if (currentStatus && currentStatus.isCritical) {
          console.warn('🚨 Critical memory - pausing progressive loader');
          break;
        }
      }
    } catch (error) {
      console.error('Progressive loader error:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  clear() {
    this.loadQueue.length = 0;
  }
  
  get queueLength() {
    return this.loadQueue.length;
  }
}

// Debounced memory-aware function executor
export function createMemoryAwareDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 100
): T {
  let timeoutId: NodeJS.Timeout;
  let lastArgs: Parameters<T>;
  
  return ((...args: Parameters<T>) => {
    lastArgs = args;
    
    clearTimeout(timeoutId);
    
    // Adjust delay based on memory pressure
    const adjustedDelay = memoryManager.isLowMemoryMode() ? delay * 2 : delay;
    
    timeoutId = setTimeout(() => {
      // Check memory before execution
      const currentStatus = memoryManager.getCurrentStatus();
      if (currentStatus && currentStatus.isCritical) {
        console.warn('🚨 Critical memory - skipping debounced function execution');
        return;
      }
      
      func(...lastArgs);
    }, adjustedDelay);
  }) as T;
}

// Memory-efficient object pool
export class ObjectPool<T> {
  private available: T[] = [];
  private createFn: () => T;
  private resetFn?: (obj: T) => void;
  private maxSize: number;
  
  constructor(createFn: () => T, resetFn?: (obj: T) => void, maxSize: number = 50) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = memoryManager.isLowMemoryMode() ? Math.min(maxSize, 20) : maxSize;
  }
  
  acquire(): T {
    if (this.available.length > 0) {
      return this.available.pop()!;
    }
    return this.createFn();
  }
  
  release(obj: T) {
    if (this.available.length < this.maxSize) {
      if (this.resetFn) {
        this.resetFn(obj);
      }
      this.available.push(obj);
    }
  }
  
  clear() {
    this.available.length = 0;
  }
  
  get size() {
    return this.available.length;
  }
}