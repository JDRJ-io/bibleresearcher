/**
 * Highlights V2 Structured Logging System
 * 
 * Provides comprehensive observability for the V2 highlights architecture
 * with standardized log formats, performance metrics, and error tracking
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface BaseLogData {
  timestamp: string;
  level: LogLevel;
  category: string;
  event: string;
  user_id?: string;
  session_id?: string;
  [key: string]: any;
}

export interface PerformanceMetrics {
  start_time: number;
  duration_ms?: number;
  memory_usage?: number;
}

// ============================================================================
// CENTRALIZED LOGGER
// ============================================================================

class V2Logger {
  private sessionId: string;
  private userId?: string;
  private logBuffer: BaseLogData[] = [];
  private readonly MAX_BUFFER_SIZE = 1000;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  setUserId(userId: string | null) {
    this.userId = userId || undefined;
  }

  private generateSessionId(): string {
    return `v2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatLog(level: LogLevel, category: string, event: string, data: any = {}): BaseLogData {
    const logEntry: BaseLogData = {
      timestamp: new Date().toISOString(),
      level,
      category,
      event,
      session_id: this.sessionId,
      user_id: this.userId,
      ...data,
    };

    // Add to buffer for debugging
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift();
    }

    return logEntry;
  }

  private output(logEntry: BaseLogData) {
    const logTag = `HL_V2_${logEntry.category.toUpperCase()}`;
    
    switch (logEntry.level) {
      case 'ERROR':
        console.error(logTag, logEntry);
        break;
      case 'WARN':
        console.warn(logTag, logEntry);
        break;
      case 'DEBUG':
        console.log(logTag, logEntry);
        break;
      default:
        console.log(logTag, logEntry);
    }
  }

  // ============================================================================
  // BOOTSTRAP LOGGING
  // ============================================================================

  bootstrapStart(data: any = {}) {
    this.output(this.formatLog('INFO', 'BOOTSTRAP', 'START', data));
  }

  bootstrapProgress(data: any = {}) {
    this.output(this.formatLog('INFO', 'BOOTSTRAP', 'PROGRESS', data));
  }

  bootstrapComplete(data: any = {}) {
    this.output(this.formatLog('INFO', 'BOOTSTRAP', 'COMPLETE', data));
  }

  bootstrapError(error: string | Error, data: any = {}) {
    this.output(this.formatLog('ERROR', 'BOOTSTRAP', 'ERROR', {
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...data,
    }));
  }

  bootstrapFallback(reason: string, data: any = {}) {
    this.output(this.formatLog('WARN', 'BOOTSTRAP', 'FALLBACK', { reason, ...data }));
  }

  // ============================================================================
  // REALTIME LOGGING
  // ============================================================================

  realtimeStart(data: any = {}) {
    this.output(this.formatLog('INFO', 'REALTIME', 'START', data));
  }

  realtimeSubscribed(data: any = {}) {
    this.output(this.formatLog('INFO', 'REALTIME', 'SUBSCRIBED', data));
  }

  realtimeStop(data: any = {}) {
    this.output(this.formatLog('INFO', 'REALTIME', 'STOP', data));
  }

  realtimeSkip(reason: string, data: any = {}) {
    this.output(this.formatLog('INFO', 'REALTIME', 'SKIP', { reason, ...data }));
  }

  realtimeEvent(eventType: string, table: 'ranges' | 'wash', data: any = {}) {
    this.output(this.formatLog('INFO', 'REALTIME', 'EVENT', {
      event_type: eventType,
      table,
      ...data,
    }));
  }

  realtimeError(error: string | Error, data: any = {}) {
    this.output(this.formatLog('ERROR', 'REALTIME', 'ERROR', {
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...data,
    }));
  }

  realtimeReconnect(reason: string, data: any = {}) {
    this.output(this.formatLog('WARN', 'REALTIME', 'RECONNECT', { reason, ...data }));
  }

  // ============================================================================
  // CACHE & PERFORMANCE LOGGING
  // ============================================================================

  cacheHit(type: 'memory' | 'dexie', key: string, data: any = {}) {
    this.output(this.formatLog('DEBUG', 'CACHE', 'HIT', { type, key, ...data }));
  }

  cacheMiss(type: 'memory' | 'dexie', key: string, data: any = {}) {
    this.output(this.formatLog('DEBUG', 'CACHE', 'MISS', { type, key, ...data }));
  }

  queryPerformance(query: string, metrics: PerformanceMetrics & any) {
    this.output(this.formatLog('INFO', 'PERFORMANCE', 'QUERY', {
      query,
      duration_ms: metrics.duration_ms || (Date.now() - metrics.start_time),
      ...metrics,
    }));
  }

  // ============================================================================
  // LOCAL-FIRST OPERATIONS
  // ============================================================================

  optimisticUpdate(operation: string, data: any = {}) {
    this.output(this.formatLog('INFO', 'LOCAL_FIRST', 'OPTIMISTIC', { operation, ...data }));
  }

  outboxQueued(operation: string, data: any = {}) {
    this.output(this.formatLog('INFO', 'LOCAL_FIRST', 'QUEUED', { operation, ...data }));
  }

  outboxProcessed(operation: string, success: boolean, data: any = {}) {
    this.output(this.formatLog(success ? 'INFO' : 'ERROR', 'LOCAL_FIRST', 'PROCESSED', {
      operation,
      success,
      ...data,
    }));
  }

  outboxRetry(operation: string, attempt: number, data: any = {}) {
    this.output(this.formatLog('WARN', 'LOCAL_FIRST', 'RETRY', { operation, attempt, ...data }));
  }

  // ============================================================================
  // LEGACY SYSTEM INTERACTIONS
  // ============================================================================

  legacyCall(endpoint: string, blocked: boolean, data: any = {}) {
    this.output(this.formatLog(blocked ? 'ERROR' : 'WARN', 'LEGACY', 'CALL', {
      endpoint,
      blocked,
      v2_enabled: true,
      ...data,
    }));
  }

  legacyFallback(reason: string, data: any = {}) {
    this.output(this.formatLog('WARN', 'LEGACY', 'FALLBACK', { reason, ...data }));
  }

  // ============================================================================
  // USER EXPERIENCE METRICS
  // ============================================================================

  userInteraction(action: string, metrics: any = {}) {
    this.output(this.formatLog('INFO', 'UX', 'INTERACTION', { action, ...metrics }));
  }

  highlightRender(verse_key: string, translation: string, metrics: any = {}) {
    this.output(this.formatLog('DEBUG', 'UX', 'RENDER', { verse_key, translation, ...metrics }));
  }

  scrollPerformance(metrics: any = {}) {
    this.output(this.formatLog('DEBUG', 'UX', 'SCROLL', metrics));
  }

  // ============================================================================
  // DIAGNOSTIC TOOLS
  // ============================================================================

  getRecentLogs(count: number = 50): BaseLogData[] {
    return this.logBuffer.slice(-count);
  }

  getLogsByCategory(category: string, count: number = 20): BaseLogData[] {
    return this.logBuffer
      .filter(log => log.category === category)
      .slice(-count);
  }

  dumpDiagnostics(): any {
    const now = Date.now();
    const last5min = this.logBuffer.filter(log => 
      new Date(log.timestamp).getTime() > now - 5 * 60 * 1000
    );

    return {
      session_id: this.sessionId,
      user_id: this.userId,
      total_logs: this.logBuffer.length,
      logs_last_5min: last5min.length,
      categories: Array.from(new Set(this.logBuffer.map(log => log.category))),
      error_count: this.logBuffer.filter(log => log.level === 'ERROR').length,
      recent_errors: this.logBuffer
        .filter(log => log.level === 'ERROR')
        .slice(-5)
        .map(log => ({ event: log.event, error: log.error })),
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const v2Logger = new V2Logger();

// Attach to window for debugging
if (typeof window !== 'undefined') {
  (window as any).v2Logger = v2Logger;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const logBootstrap = {
  start: (data?: any) => v2Logger.bootstrapStart(data),
  progress: (data?: any) => v2Logger.bootstrapProgress(data),
  complete: (data?: any) => v2Logger.bootstrapComplete(data),
  error: (error: string | Error, data?: any) => v2Logger.bootstrapError(error, data),
  fallback: (reason: string, data?: any) => v2Logger.bootstrapFallback(reason, data),
};

export const logRealtime = {
  start: (data?: any) => v2Logger.realtimeStart(data),
  subscribed: (data?: any) => v2Logger.realtimeSubscribed(data),
  stop: (data?: any) => v2Logger.realtimeStop(data),
  skip: (reason: string, data?: any) => v2Logger.realtimeSkip(reason, data),
  event: (eventType: string, table: 'ranges' | 'wash', data?: any) => 
    v2Logger.realtimeEvent(eventType, table, data),
  error: (error: string | Error, data?: any) => v2Logger.realtimeError(error, data),
  reconnect: (reason: string, data?: any) => v2Logger.realtimeReconnect(reason, data),
};

export const logCache = {
  hit: (type: 'memory' | 'dexie', key: string, data?: any) => v2Logger.cacheHit(type, key, data),
  miss: (type: 'memory' | 'dexie', key: string, data?: any) => v2Logger.cacheMiss(type, key, data),
};

export const logPerformance = {
  query: (query: string, metrics: PerformanceMetrics & any) => v2Logger.queryPerformance(query, metrics),
};

export const logLocalFirst = {
  optimistic: (operation: string, data?: any) => v2Logger.optimisticUpdate(operation, data),
  queued: (operation: string, data?: any) => v2Logger.outboxQueued(operation, data),
  processed: (operation: string, success: boolean, data?: any) => 
    v2Logger.outboxProcessed(operation, success, data),
  retry: (operation: string, attempt: number, data?: any) => 
    v2Logger.outboxRetry(operation, attempt, data),
};

export const logLegacy = {
  call: (endpoint: string, blocked: boolean, data?: any) => v2Logger.legacyCall(endpoint, blocked, data),
  fallback: (reason: string, data?: any) => v2Logger.legacyFallback(reason, data),
};

export const logUX = {
  interaction: (action: string, metrics?: any) => v2Logger.userInteraction(action, metrics),
  render: (verse_key: string, translation: string, metrics?: any) => 
    v2Logger.highlightRender(verse_key, translation, metrics),
  scroll: (metrics?: any) => v2Logger.scrollPerformance(metrics),
};