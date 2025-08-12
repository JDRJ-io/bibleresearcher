// Performance Monitor for Mobile Bible Reading Experience
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private performanceObserver: PerformanceObserver | null = null;
  private frameRateMonitor: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private averageFPS = 60;
  
  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }
  
  startMonitoring() {
    if (typeof window === 'undefined') return;
    
    // Monitor long tasks
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > 50) { // Tasks longer than 50ms
          console.warn(`⚠️ Long task detected: ${entry.name} (${Math.round(entry.duration)}ms)`);
          
          // If on mobile and task is very long, trigger cleanup
          if (window.innerWidth <= 768 && entry.duration > 100) {
            window.dispatchEvent(new CustomEvent('mobile-memory-warning'));
          }
        }
      });
    });
    
    try {
      this.performanceObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.log('Long task monitoring not supported');
    }
    
    // Monitor frame rate on mobile
    if (window.innerWidth <= 768) {
      this.startFrameRateMonitoring();
    }
    
    console.log('📊 Performance monitoring started');
  }
  
  private startFrameRateMonitoring() {
    const measureFrameRate = (timestamp: number) => {
      if (this.lastFrameTime > 0) {
        const delta = timestamp - this.lastFrameTime;
        const fps = 1000 / delta;
        this.frameCount++;
        
        // Calculate rolling average
        this.averageFPS = (this.averageFPS * 0.9) + (fps * 0.1);
        
        // Log every 60 frames
        if (this.frameCount % 60 === 0) {
          console.log(`📱 Mobile FPS: ${Math.round(this.averageFPS)}`);
          
          // If FPS drops below 30, trigger gentle cleanup
          if (this.averageFPS < 30) {
            console.warn('🐌 Low FPS detected, triggering cleanup');
            window.dispatchEvent(new CustomEvent('mobile-memory-warning'));
          }
        }
      }
      
      this.lastFrameTime = timestamp;
      this.frameRateMonitor = requestAnimationFrame(measureFrameRate);
    };
    
    this.frameRateMonitor = requestAnimationFrame(measureFrameRate);
  }
  
  stopMonitoring() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    if (this.frameRateMonitor) {
      cancelAnimationFrame(this.frameRateMonitor);
      this.frameRateMonitor = null;
    }
    
    console.log('📊 Performance monitoring stopped');
  }
  
  getPerformanceMetrics() {
    const memInfo = (performance as any).memory;
    
    return {
      averageFPS: Math.round(this.averageFPS),
      memoryUsedMB: memInfo ? Math.round(memInfo.usedJSHeapSize / 1024 / 1024) : null,
      memoryLimitMB: memInfo ? Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) : null,
      memoryPressure: memInfo ? memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit : null
    };
  }
}

// Auto-start on mobile
if (typeof window !== 'undefined' && window.innerWidth <= 768) {
  const monitor = PerformanceMonitor.getInstance();
  monitor.startMonitoring();
}