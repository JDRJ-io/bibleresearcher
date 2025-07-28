// Global Logging System for Biblical Research Platform
// Comprehensive filesystem and data flow tracking

export interface LogEntry {
  timestamp: number;
  category: 'filesystem' | 'data-flow' | 'state-change' | 'performance' | 'error' | 'user-action';
  subcategory: string;
  operation: string;
  details: Record<string, any>;
  stackTrace?: string;
  component?: string;
  duration?: number;
}

export interface SystemState {
  activeComponents: Set<string>;
  dataLoading: Map<string, boolean>;
  cacheHits: Map<string, number>;
  cacheMisses: Map<string, number>;
  filesAccessed: Map<string, number>;
  apiCalls: Map<string, number>;
  renderCycles: Map<string, number>;
}

class GlobalLogger {
  private logs: LogEntry[] = [];
  private startTime = Date.now();
  private systemState: SystemState = {
    activeComponents: new Set(),
    dataLoading: new Map(),
    cacheHits: new Map(),
    cacheMisses: new Map(),
    filesAccessed: new Map(),
    apiCalls: new Map(),
    renderCycles: new Map(),
  };
  private enabled = true;
  private maxLogs = 10000; // Prevent memory issues

  // Core logging method
  log(
    category: LogEntry['category'],
    subcategory: string,
    operation: string,
    details: Record<string, any> = {},
    component?: string,
    startTime?: number
  ) {
    if (!this.enabled) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      category,
      subcategory,
      operation,
      details: { ...details },
      component,
      stackTrace: this.getStackTrace(),
      duration: startTime ? Date.now() - startTime : undefined,
    };

    this.logs.push(entry);
    
    // Maintain log size limit
    if (this.logs.length > this.maxLogs) {
      this.logs.splice(0, this.logs.length - this.maxLogs);
    }

    // Update system state tracking
    this.updateSystemState(entry);

    // Console output with structured formatting
    this.consoleOutput(entry);
  }

  // Filesystem operation tracking
  logFileAccess(filePath: string, operation: 'read' | 'write' | 'cache-hit' | 'cache-miss', details: any = {}) {
    const count = this.systemState.filesAccessed.get(filePath) || 0;
    this.systemState.filesAccessed.set(filePath, count + 1);

    this.log('filesystem', 'file-access', operation, {
      filePath,
      accessCount: count + 1,
      ...details
    });
  }

  // Data flow tracking
  logDataFlow(source: string, destination: string, dataType: string, operation: string, details: any = {}) {
    this.log('data-flow', 'data-movement', operation, {
      source,
      destination,
      dataType,
      ...details
    });
  }

  // State change tracking
  logStateChange(component: string, stateKey: string, oldValue: any, newValue: any, details: any = {}) {
    this.log('state-change', component, 'state-update', {
      stateKey,
      oldValue: this.serializeValue(oldValue),
      newValue: this.serializeValue(newValue),
      ...details
    });
  }

  // Performance tracking
  logPerformance(operation: string, duration: number, details: any = {}) {
    this.log('performance', 'timing', operation, {
      duration,
      ...details
    });
  }

  // Component lifecycle tracking
  logComponentLifecycle(component: string, lifecycle: 'mount' | 'unmount' | 'render' | 'update', details: any = {}) {
    if (lifecycle === 'mount') {
      this.systemState.activeComponents.add(component);
    } else if (lifecycle === 'unmount') {
      this.systemState.activeComponents.delete(component);
    }

    const renderCount = this.systemState.renderCycles.get(component) || 0;
    if (lifecycle === 'render') {
      this.systemState.renderCycles.set(component, renderCount + 1);
    }

    this.log('data-flow', 'component-lifecycle', lifecycle, {
      component,
      renderCount: lifecycle === 'render' ? renderCount + 1 : renderCount,
      ...details
    });
  }

  // API call tracking
  logApiCall(endpoint: string, method: string, success: boolean, duration?: number, details: any = {}) {
    const key = `${method} ${endpoint}`;
    const count = this.systemState.apiCalls.get(key) || 0;
    this.systemState.apiCalls.set(key, count + 1);

    this.log('data-flow', 'api-call', success ? 'success' : 'failure', {
      endpoint,
      method,
      callCount: count + 1,
      duration,
      ...details
    });
  }

  // Cache operation tracking
  logCacheOperation(cacheKey: string, operation: 'hit' | 'miss' | 'set' | 'delete', details: any = {}) {
    if (operation === 'hit') {
      const hits = this.systemState.cacheHits.get(cacheKey) || 0;
      this.systemState.cacheHits.set(cacheKey, hits + 1);
    } else if (operation === 'miss') {
      const misses = this.systemState.cacheMisses.get(cacheKey) || 0;
      this.systemState.cacheMisses.set(cacheKey, misses + 1);
    }

    this.log('data-flow', 'cache', operation, {
      cacheKey,
      hits: this.systemState.cacheHits.get(cacheKey) || 0,
      misses: this.systemState.cacheMisses.get(cacheKey) || 0,
      ...details
    });
  }

  // Error tracking
  logError(error: Error | string, context: string, details: any = {}) {
    this.log('error', context, 'error', {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...details
    });
  }

  // User action tracking
  logUserAction(action: string, target: string, details: any = {}) {
    this.log('user-action', action, target, details);
  }

  // Analysis and reporting methods
  getSystemSummary() {
    return {
      totalLogs: this.logs.length,
      uptime: Date.now() - this.startTime,
      activeComponents: Array.from(this.systemState.activeComponents),
      topAccessedFiles: this.getTopEntries(this.systemState.filesAccessed),
      topApiCalls: this.getTopEntries(this.systemState.apiCalls),
      cacheEfficiency: this.getCacheEfficiency(),
      errorCount: this.logs.filter(log => log.category === 'error').length,
      performanceMetrics: this.getPerformanceMetrics(),
    };
  }

  getFileSystemMap() {
    const fileAccess = Array.from(this.systemState.filesAccessed.entries())
      .map(([file, count]) => ({ file, accessCount: count }))
      .sort((a, b) => b.accessCount - a.accessCount);

    const fileOperations = this.logs
      .filter(log => log.category === 'filesystem')
      .reduce((acc, log) => {
        const file = log.details.filePath;
        if (!acc[file]) acc[file] = [];
        acc[file].push({
          operation: log.operation,
          timestamp: log.timestamp,
          details: log.details
        });
        return acc;
      }, {} as Record<string, any[]>);

    return { fileAccess, fileOperations };
  }

  getDataFlowMap() {
    const dataFlows = this.logs
      .filter(log => log.category === 'data-flow')
      .map(log => ({
        source: log.details.source,
        destination: log.details.destination,
        dataType: log.details.dataType,
        operation: log.operation,
        timestamp: log.timestamp,
        component: log.component
      }))
      .filter(flow => flow.source && flow.destination);

    return dataFlows;
  }

  // Export logs for analysis
  exportLogs(category?: LogEntry['category']) {
    const filteredLogs = category 
      ? this.logs.filter(log => log.category === category)
      : this.logs;

    return {
      logs: filteredLogs,
      summary: this.getSystemSummary(),
      fileSystemMap: this.getFileSystemMap(),
      dataFlowMap: this.getDataFlowMap(),
      exportTime: Date.now(),
    };
  }

  // Control methods
  enable() { this.enabled = true; }
  disable() { this.enabled = false; }
  clear() { 
    this.logs = []; 
    this.systemState = {
      activeComponents: new Set(),
      dataLoading: new Map(),
      cacheHits: new Map(),
      cacheMisses: new Map(),
      filesAccessed: new Map(),
      apiCalls: new Map(),
      renderCycles: new Map(),
    };
  }

  // Private helper methods
  private updateSystemState(entry: LogEntry) {
    // Update loading states
    if (entry.details.loading !== undefined) {
      this.systemState.dataLoading.set(entry.component || 'unknown', entry.details.loading);
    }
  }

  private consoleOutput(entry: LogEntry) {
    const icon = this.getCategoryIcon(entry.category);
    const color = this.getCategoryColor(entry.category);
    
    const prefix = `${icon} [${entry.category.toUpperCase()}:${entry.subcategory}]`;
    const operation = `${entry.operation}`;
    const component = entry.component ? ` (${entry.component})` : '';
    const duration = entry.duration ? ` [${entry.duration}ms]` : '';
    
    console.log(
      `%c${prefix}%c ${operation}${component}${duration}`,
      `color: ${color}; font-weight: bold`,
      'color: inherit',
      entry.details
    );
  }

  private getCategoryIcon(category: LogEntry['category']): string {
    const icons = {
      'filesystem': '📁',
      'data-flow': '🔄',
      'state-change': '🔄',
      'performance': '⚡',
      'error': '❌',
      'user-action': '👆'
    };
    return icons[category] || '📋';
  }

  private getCategoryColor(category: LogEntry['category']): string {
    const colors = {
      'filesystem': '#4F46E5',
      'data-flow': '#059669',
      'state-change': '#DC2626',
      'performance': '#D97706',
      'error': '#DC2626',
      'user-action': '#7C3AED'
    };
    return colors[category] || '#6B7280';
  }

  private getStackTrace(): string {
    const stack = new Error().stack;
    return stack ? stack.split('\n').slice(3, 8).join('\n') : '';
  }

  private serializeValue(value: any): any {
    if (value === null || value === undefined) return value;
    if (typeof value === 'function') return '[Function]';
    if (value instanceof Map) return `[Map:${value.size} entries]`;
    if (value instanceof Set) return `[Set:${value.size} entries]`;
    if (Array.isArray(value) && value.length > 10) {
      return `[Array:${value.length} items]`;
    }
    if (typeof value === 'object' && Object.keys(value).length > 10) {
      return `[Object:${Object.keys(value).length} keys]`;
    }
    return value;
  }

  private getTopEntries(map: Map<string, number>, limit = 10) {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => ({ key, count }));
  }

  private getCacheEfficiency() {
    const totalHits = Array.from(this.systemState.cacheHits.values()).reduce((a, b) => a + b, 0);
    const totalMisses = Array.from(this.systemState.cacheMisses.values()).reduce((a, b) => a + b, 0);
    const total = totalHits + totalMisses;
    return total > 0 ? (totalHits / total * 100).toFixed(2) : '0.00';
  }

  private getPerformanceMetrics() {
    const perfLogs = this.logs.filter(log => log.category === 'performance' && log.duration);
    if (perfLogs.length === 0) return {};

    const durations = perfLogs.map(log => log.duration!);
    return {
      count: durations.length,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
    };
  }
}

// Global instance
export const globalLogger = new GlobalLogger();

// Convenience methods for common patterns
export const logFile = (path: string, operation: 'read' | 'write' | 'cache-hit' | 'cache-miss', details?: any) => 
  globalLogger.logFileAccess(path, operation, details);

export const logData = (source: string, dest: string, type: string, op: string, details?: any) =>
  globalLogger.logDataFlow(source, dest, type, op, details);

export const logState = (component: string, key: string, oldVal: any, newVal: any, details?: any) =>
  globalLogger.logStateChange(component, key, oldVal, newVal, details);

export const logPerf = (operation: string, duration: number, details?: any) =>
  globalLogger.logPerformance(operation, duration, details);

export const logComponent = (component: string, lifecycle: 'mount' | 'unmount' | 'render' | 'update', details?: any) =>
  globalLogger.logComponentLifecycle(component, lifecycle, details);

export const logApi = (endpoint: string, method: string, success: boolean, duration?: number, details?: any) =>
  globalLogger.logApiCall(endpoint, method, success, duration, details);

export const logCache = (key: string, operation: 'hit' | 'miss' | 'set' | 'delete', details?: any) =>
  globalLogger.logCacheOperation(key, operation, details);

export const logError = (error: Error | string, context: string, details?: any) =>
  globalLogger.logError(error, context, details);

export const logUser = (action: string, target: string, details?: any) =>
  globalLogger.logUserAction(action, target, details);

// Performance measurement utility
export const measurePerformance = <T>(operation: string, fn: () => T, details?: any): T => {
  const start = Date.now();
  try {
    const result = fn();
    globalLogger.logPerformance(operation, Date.now() - start, details);
    return result;
  } catch (error) {
    globalLogger.logPerformance(operation, Date.now() - start, { ...details, error: true });
    throw error;
  }
};

// Async performance measurement utility
export const measurePerformanceAsync = async <T>(operation: string, fn: () => Promise<T>, details?: any): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    globalLogger.logPerformance(operation, Date.now() - start, details);
    return result;
  } catch (error) {
    globalLogger.logPerformance(operation, Date.now() - start, { ...details, error: true });
    throw error;
  }
};

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).globalLogger = globalLogger;
  (window as any).exportSystemLogs = () => globalLogger.exportLogs();
  (window as any).getSystemSummary = () => globalLogger.getSystemSummary();
  (window as any).getFileSystemMap = () => globalLogger.getFileSystemMap();
  (window as any).getDataFlowMap = () => globalLogger.getDataFlowMap();
}