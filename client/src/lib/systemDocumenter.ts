// Comprehensive System Documentation Generator
// Automatically maps all filesystem operations and generates real implementation docs

import { globalLogger } from './globalLogger';

interface FileAccess {
  path: string;
  count: number;
  operations: string[];
  components: string[];
  lastAccessed: number;
  size?: number;
  type: 'supabase-storage' | 'indexeddb' | 'local-storage' | 'memory-cache' | 'unknown';
}

interface ComponentInteraction {
  component: string;
  renderCount: number;
  dataOperations: string[];
  filesAccessed: string[];
  apiCalls: string[];
  stateChanges: number;
  errors: number;
  averageRenderTime?: number;
}

interface DataFlow {
  source: string;
  destination: string;
  dataType: string;
  operationCount: number;
  operations: string[];
  lastOperation: number;
}

interface SystemArchitecture {
  overview: string;
  coreComponents: ComponentInteraction[];
  fileSystemMap: FileAccess[];
  dataFlows: DataFlow[];
  cachingStrategy: {
    cacheHits: Record<string, number>;
    cacheMisses: Record<string, number>;
    efficiency: string;
  };
  performanceMetrics: {
    slowestOperations: Array<{ operation: string; averageTime: number; count: number }>;
    fastestOperations: Array<{ operation: string; averageTime: number; count: number }>;
    totalOperations: number;
  };
  errorAnalysis: {
    commonErrors: Array<{ error: string; count: number; contexts: string[] }>;
    errorRate: string;
  };
  timestamp: number;
}

export class SystemDocumenter {
  private updateInterval: NodeJS.Timeout | null = null;
  private lastDocumentation: SystemArchitecture | null = null;

  start() {
    // DISABLED: Performance impact too high
    // Update documentation every 30 seconds
    // this.updateInterval = setInterval(() => {
    //   this.generateDocumentation();
    // }, 30000);

    // Initial documentation
    // this.generateDocumentation();
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  generateDocumentation(): SystemArchitecture {
    const logs = globalLogger.exportLogs();
    const fileSystemMap = globalLogger.getFileSystemMap();
    const dataFlowMap = globalLogger.getDataFlowMap();
    const summary = globalLogger.getSystemSummary();

    // Analyze file access patterns
    const fileAccesses: FileAccess[] = fileSystemMap.fileAccess.map(file => {
      const operations = logs.logs
        .filter(log => log.category === 'filesystem' && log.details.filePath === file.file)
        .map(log => log.operation);
      
      const components = logs.logs
        .filter(log => log.category === 'filesystem' && log.details.filePath === file.file && log.component)
        .map(log => log.component!)
        .filter((comp, index, arr) => arr.indexOf(comp) === index);

      const lastAccessed = Math.max(...logs.logs
        .filter(log => log.category === 'filesystem' && log.details.filePath === file.file)
        .map(log => log.timestamp));

      const type = this.determineFileType(file.file);

      return {
        path: file.file,
        count: file.accessCount,
        operations: Array.from(new Set(operations)),
        components,
        lastAccessed,
        type
      };
    });

    // Analyze component interactions
    const componentMap = new Map<string, ComponentInteraction>();
    
    logs.logs.forEach(log => {
      if (!log.component) return;
      
      if (!componentMap.has(log.component)) {
        componentMap.set(log.component, {
          component: log.component,
          renderCount: 0,
          dataOperations: [],
          filesAccessed: [],
          apiCalls: [],
          stateChanges: 0,
          errors: 0
        });
      }

      const comp = componentMap.get(log.component)!;

      switch (log.category) {
        case 'data-flow':
          if (log.subcategory === 'component-lifecycle' && log.operation === 'render') {
            comp.renderCount++;
          } else if (log.subcategory === 'api-call') {
            comp.apiCalls.push(`${log.details.method} ${log.details.endpoint}`);
          } else {
            comp.dataOperations.push(`${log.subcategory}:${log.operation}`);
          }
          break;
        case 'filesystem':
          if (log.details.filePath) {
            comp.filesAccessed.push(log.details.filePath);
          }
          break;
        case 'state-change':
          comp.stateChanges++;
          break;
        case 'error':
          comp.errors++;
          break;
      }
    });

    const coreComponents = Array.from(componentMap.values())
      .map(comp => ({
        ...comp,
        dataOperations: Array.from(new Set(comp.dataOperations)),
        filesAccessed: Array.from(new Set(comp.filesAccessed)),
        apiCalls: Array.from(new Set(comp.apiCalls))
      }))
      .sort((a, b) => b.renderCount - a.renderCount);

    // Analyze data flows
    const dataFlowMap2 = new Map<string, DataFlow>();
    
    dataFlowMap.forEach(flow => {
      const key = `${flow.source} → ${flow.destination}`;
      if (!dataFlowMap2.has(key)) {
        dataFlowMap2.set(key, {
          source: flow.source,
          destination: flow.destination,
          dataType: flow.dataType,
          operationCount: 0,
          operations: [],
          lastOperation: 0
        });
      }

      const df = dataFlowMap2.get(key)!;
      df.operationCount++;
      df.operations.push(flow.operation);
      df.lastOperation = Math.max(df.lastOperation, flow.timestamp);
    });

    const dataFlows = Array.from(dataFlowMap2.values())
      .map(df => ({
        ...df,
        operations: Array.from(new Set(df.operations))
      }))
      .sort((a, b) => b.operationCount - a.operationCount);

    // Performance analysis
    const performanceLogs = logs.logs.filter(log => log.category === 'performance' && log.duration);
    const operationTimes = new Map<string, number[]>();

    performanceLogs.forEach(log => {
      const key = log.operation;
      if (!operationTimes.has(key)) {
        operationTimes.set(key, []);
      }
      operationTimes.get(key)!.push(log.duration!);
    });

    const performanceMetrics = {
      totalOperations: performanceLogs.length,
      slowestOperations: Array.from(operationTimes.entries())
        .map(([op, times]) => ({
          operation: op,
          averageTime: times.reduce((a, b) => a + b, 0) / times.length,
          count: times.length
        }))
        .sort((a, b) => b.averageTime - a.averageTime)
        .slice(0, 10),
      fastestOperations: Array.from(operationTimes.entries())
        .map(([op, times]) => ({
          operation: op,
          averageTime: times.reduce((a, b) => a + b, 0) / times.length,
          count: times.length
        }))
        .sort((a, b) => a.averageTime - b.averageTime)
        .slice(0, 10)
    };

    // Error analysis
    const errorLogs = logs.logs.filter(log => log.category === 'error');
    const errorMap = new Map<string, { count: number; contexts: string[] }>();

    errorLogs.forEach(log => {
      const error = log.details.message || 'Unknown error';
      if (!errorMap.has(error)) {
        errorMap.set(error, { count: 0, contexts: [] });
      }
      errorMap.get(error)!.count++;
      errorMap.get(error)!.contexts.push(log.subcategory);
    });

    const errorAnalysis = {
      commonErrors: Array.from(errorMap.entries())
        .map(([error, data]) => ({
          error,
          count: data.count,
          contexts: Array.from(new Set(data.contexts))
        }))
        .sort((a, b) => b.count - a.count),
      errorRate: logs.logs.length > 0 ? 
        ((errorLogs.length / logs.logs.length) * 100).toFixed(2) + '%' : '0%'
    };

    const documentation: SystemArchitecture = {
      overview: this.generateOverview(coreComponents, fileAccesses, summary),
      coreComponents,
      fileSystemMap: fileAccesses,
      dataFlows,
      cachingStrategy: {
        cacheHits: Object.fromEntries(summary.topAccessedFiles?.map(f => [f.key, f.count]) || []),
        cacheMisses: {},
        efficiency: summary.cacheEfficiency || '0.00'
      },
      performanceMetrics,
      errorAnalysis,
      timestamp: Date.now()
    };

    this.lastDocumentation = documentation;
    
    // Log the documentation update
    globalLogger.log('data-flow', 'system-documenter', 'documentation-generated', {
      componentsAnalyzed: coreComponents.length,
      filesTracked: fileAccesses.length,
      dataFlowsIdentified: dataFlows.length,
      totalLogs: logs.logs.length
    });

    return documentation;
  }

  private determineFileType(filePath: string): FileAccess['type'] {
    if (filePath.includes('translations/') || filePath.includes('references/') || 
        filePath.includes('metadata/') || filePath.includes('strongs/') || 
        filePath.includes('labels/')) {
      return 'supabase-storage';
    }
    if (filePath.includes('indexeddb') || filePath.includes('dexie')) {
      return 'indexeddb';
    }
    if (filePath.includes('localStorage')) {
      return 'local-storage';
    }
    if (filePath.includes('cache')) {
      return 'memory-cache';
    }
    return 'unknown';
  }

  private generateOverview(components: ComponentInteraction[], files: FileAccess[], summary: any): string {
    const topComponent = components[0];
    const topFile = files[0];
    const activeComps = components.filter(c => c.renderCount > 0).length;
    
    return `Biblical Research Platform - Real Implementation Analysis
Generated: ${new Date().toLocaleString()}

Active Components: ${activeComps}/${components.length}
Most Active Component: ${topComponent?.component || 'None'} (${topComponent?.renderCount || 0} renders)
Most Accessed File: ${topFile?.path || 'None'} (${topFile?.count || 0} accesses)
Cache Efficiency: ${summary.cacheEfficiency || '0.00'}%
Total System Uptime: ${summary.uptime ? Math.round(summary.uptime / 1000) : 0}s

This analysis reveals the actual data flow patterns, filesystem usage, and component interactions
in the running Biblical Research Platform, providing insights beyond the static documentation.`;
  }

  exportMarkdownReport(): string {
    if (!this.lastDocumentation) {
      this.generateDocumentation();
    }

    const doc = this.lastDocumentation!;
    
    return `# Biblical Research Platform - Real Implementation Report

${doc.overview}

## Core Components

${doc.coreComponents.map(comp => `
### ${comp.component}
- **Renders:** ${comp.renderCount}
- **Data Operations:** ${comp.dataOperations.join(', ')}
- **Files Accessed:** ${comp.filesAccessed.slice(0, 5).join(', ')}${comp.filesAccessed.length > 5 ? '...' : ''}
- **API Calls:** ${comp.apiCalls.slice(0, 3).join(', ')}${comp.apiCalls.length > 3 ? '...' : ''}
- **State Changes:** ${comp.stateChanges}
- **Errors:** ${comp.errors}
`).join('')}

## File System Usage

| File | Type | Access Count | Components | Operations |
|------|------|--------------|------------|------------|
${doc.fileSystemMap.slice(0, 20).map(file => 
  `| \`${file.path}\` | ${file.type} | ${file.count} | ${file.components.slice(0, 2).join(', ')} | ${file.operations.slice(0, 3).join(', ')} |`
).join('\n')}

## Data Flow Patterns

${doc.dataFlows.slice(0, 15).map(flow => `
### ${flow.source} → ${flow.destination}
- **Data Type:** ${flow.dataType}
- **Operations:** ${flow.operationCount} (${flow.operations.join(', ')})
- **Last Activity:** ${new Date(flow.lastOperation).toLocaleTimeString()}
`).join('')}

## Performance Analysis

### Slowest Operations
${doc.performanceMetrics.slowestOperations.map(op => 
  `- **${op.operation}:** ${op.averageTime.toFixed(2)}ms avg (${op.count} calls)`
).join('\n')}

### Fastest Operations  
${doc.performanceMetrics.fastestOperations.map(op => 
  `- **${op.operation}:** ${op.averageTime.toFixed(2)}ms avg (${op.count} calls)`
).join('\n')}

## Caching Strategy

- **Efficiency:** ${doc.cachingStrategy.efficiency}%
- **Hit Rate Analysis:** Based on ${Object.keys(doc.cachingStrategy.cacheHits).length} cached resources

## Error Analysis

- **Error Rate:** ${doc.errorAnalysis.errorRate}
- **Common Issues:**
${doc.errorAnalysis.commonErrors.slice(0, 10).map(err => 
  `  - **${err.error}** (${err.count} occurrences) in: ${err.contexts.join(', ')}`
).join('\n')}

---
*Report generated on ${new Date(doc.timestamp).toLocaleString()} by the Global Logging System*
`;
  }

  getLastDocumentation(): SystemArchitecture | null {
    return this.lastDocumentation;
  }
}

// Global instance
export const systemDocumenter = new SystemDocumenter();

// Auto-start if we're in the browser
if (typeof window !== 'undefined') {
  systemDocumenter.start();
  
  // Global access for debugging
  (window as any).systemDocumenter = systemDocumenter;
  (window as any).exportSystemReport = () => systemDocumenter.exportMarkdownReport();
  (window as any).getSystemArchitecture = () => systemDocumenter.getLastDocumentation();
}