// Mobile Memory Monitor - Prevents crashes on low-memory devices
export class MobileMemoryMonitor {
  private static instance: MobileMemoryMonitor;
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  
  static getInstance(): MobileMemoryMonitor {
    if (!this.instance) {
      this.instance = new MobileMemoryMonitor();
    }
    return this.instance;
  }
  
  startMonitoring() {
    if (this.isMonitoring) return;
    
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return; // Only monitor on mobile devices
    
    this.isMonitoring = true;
    
    // Check memory every 10 seconds on mobile
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryPressure();
    }, 10000);
    
    console.log('📱 Mobile memory monitoring started');
  }
  
  stopMonitoring() {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    this.isMonitoring = false;
    console.log('📱 Mobile memory monitoring stopped');
  }
  
  private checkMemoryPressure() {
    const memInfo = (performance as any).memory;
    if (!memInfo) return;
    
    const memoryPressure = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
    const usedMB = Math.round(memInfo.usedJSHeapSize / 1024 / 1024);
    const limitMB = Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024);
    
    if (memoryPressure > 0.85) {
      console.warn(`🚨 CRITICAL memory pressure: ${usedMB}MB/${limitMB}MB (${Math.round(memoryPressure * 100)}%)`);
      this.triggerEmergencyCleanup();
    } else if (memoryPressure > 0.7) {
      console.log(`⚠️ High memory pressure: ${usedMB}MB/${limitMB}MB (${Math.round(memoryPressure * 100)}%)`);
      this.triggerGentleCleanup();
    }
  }
  
  private triggerEmergencyCleanup() {
    // Trigger emergency cache clearing across the app
    window.dispatchEvent(new CustomEvent('mobile-memory-emergency'));
    
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }
  
  private triggerGentleCleanup() {
    // Trigger gentle cleanup across the app
    window.dispatchEvent(new CustomEvent('mobile-memory-warning'));
  }
  
  getMemoryStatus() {
    const memInfo = (performance as any).memory;
    if (!memInfo) return null;
    
    return {
      usedMB: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
      limitMB: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024),
      pressure: memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit
    };
  }
}

// Auto-start monitoring on mobile devices
if (typeof window !== 'undefined' && window.innerWidth <= 768) {
  const monitor = MobileMemoryMonitor.getInstance();
  monitor.startMonitoring();
}