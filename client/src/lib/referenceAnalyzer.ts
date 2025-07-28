// Reference Column Loading Pattern Analysis
// Analyzes the global logger data to understand how reference columns load

import { globalLogger } from './globalLogger';

interface ReferenceLoadingPattern {
  pathway: string;
  description: string;
  frequency: number;
  efficiency: 'high' | 'medium' | 'low';
  purpose: string;
  filesSources: string[];
  components: string[];
  averageTime?: number;
  cacheHitRate?: number;
}

export class ReferenceAnalyzer {
  
  analyzeReferenceColumnLoading(): ReferenceLoadingPattern[] {
    const logs = globalLogger.exportLogs();
    const fileSystemMap = globalLogger.getFileSystemMap();
    
    // Look for patterns in reference-related file access
    const referenceFiles = fileSystemMap.fileAccess.filter(file => 
      file.file.includes('references/') || 
      file.file.includes('cf1') || 
      file.file.includes('cf2') ||
      file.file.includes('cross') ||
      file.file.toLowerCase().includes('ref')
    );

    // Analyze different loading pathways
    const patterns: ReferenceLoadingPattern[] = [];

    // Pattern 1: Cross-reference file loading
    const crossRefFiles = referenceFiles.filter(f => f.file.includes('cf1') || f.file.includes('cf2'));
    if (crossRefFiles.length > 0) {
      patterns.push({
        pathway: 'cross-reference-bulk-load',
        description: 'Loads cross-reference data from cf1.txt and cf2.txt files with offset indexes',
        frequency: crossRefFiles.reduce((sum, f) => sum + f.accessCount, 0),
        efficiency: 'high',
        purpose: 'Primary cross-reference data loading with byte-offset optimization',
        filesSources: crossRefFiles.map(f => f.file),
        components: this.getComponentsAccessingFiles(crossRefFiles.map(f => f.file), logs.logs)
      });
    }

    // Pattern 2: Individual verse cross-reference loading
    const apiCrossRefCalls = logs.logs.filter(log => 
      log.category === 'data-flow' && 
      log.subcategory === 'api-call' && 
      (log.details.endpoint?.includes('crossref') || log.operation?.includes('CrossRef'))
    );
    
    if (apiCrossRefCalls.length > 0) {
      patterns.push({
        pathway: 'individual-verse-crossref',
        description: 'Per-verse cross-reference API calls for specific verses',
        frequency: apiCrossRefCalls.length,
        efficiency: 'medium',
        purpose: 'On-demand loading for visible verses in virtual scroll',
        filesSources: ['API calls'],
        components: Array.from(new Set(apiCrossRefCalls.map(log => log.component).filter(Boolean))),
        averageTime: this.calculateAverageTime(apiCrossRefCalls)
      });
    }

    // Pattern 3: Cache-based reference loading
    const cacheHits = logs.logs.filter(log => 
      log.category === 'data-flow' && 
      log.details?.cacheHit && 
      (log.operation?.toLowerCase().includes('ref') || log.operation?.toLowerCase().includes('cross'))
    );

    if (cacheHits.length > 0) {
      patterns.push({
        pathway: 'cache-reference-retrieval',
        description: 'Memory cache retrieval for previously loaded cross-references',
        frequency: cacheHits.length,
        efficiency: 'high',
        purpose: 'Fast retrieval of already-loaded reference data',
        filesSources: ['Memory cache'],
        components: Array.from(new Set(cacheHits.map(log => log.component).filter(Boolean))),
        averageTime: this.calculateAverageTime(cacheHits),
        cacheHitRate: this.calculateCacheHitRate(logs.logs)
      });
    }

    // Pattern 4: Offline/IndexedDB reference loading
    const offlineReferenceCalls = logs.logs.filter(log => 
      log.category === 'filesystem' && 
      (log.details.filePath?.includes('indexeddb') || log.details.storage === 'indexeddb') &&
      log.operation?.toLowerCase().includes('ref')
    );

    if (offlineReferenceCalls.length > 0) {
      patterns.push({
        pathway: 'offline-indexeddb-references',
        description: 'Offline storage retrieval from IndexedDB for cross-references',
        frequency: offlineReferenceCalls.length,
        efficiency: 'medium',
        purpose: 'Offline capability - references available without network',
        filesSources: ['IndexedDB'],
        components: Array.from(new Set(offlineReferenceCalls.map(log => log.component).filter(Boolean))),
        averageTime: this.calculateAverageTime(offlineReferenceCalls)
      });
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  private getComponentsAccessingFiles(files: string[], logs: any[]): string[] {
    const components = logs
      .filter(log => 
        log.category === 'filesystem' && 
        files.some(file => log.details.filePath?.includes(file.split('/').pop()))
      )
      .map(log => log.component)
      .filter(Boolean);
    
    return Array.from(new Set(components));
  }

  private calculateAverageTime(logs: any[]): number | undefined {
    const timings = logs.map(log => log.duration).filter(Boolean);
    return timings.length > 0 ? 
      timings.reduce((a, b) => a + b, 0) / timings.length : 
      undefined;
  }

  private calculateCacheHitRate(logs: any[]): number {
    const cacheAttempts = logs.filter(log => 
      log.details?.cacheHit !== undefined || log.details?.cacheMiss !== undefined
    );
    const hits = logs.filter(log => log.details?.cacheHit === true);
    
    return cacheAttempts.length > 0 ? 
      (hits.length / cacheAttempts.length) * 100 : 0;
  }

  generateEfficiencyReport(): string {
    const patterns = this.analyzeReferenceColumnLoading();
    
    let report = `# Reference Column Loading Analysis\n\n`;
    report += `Found ${patterns.length} distinct loading patterns:\n\n`;

    patterns.forEach((pattern, index) => {
      report += `## ${index + 1}. ${pattern.pathway.replace(/-/g, ' ').toUpperCase()}\n`;
      report += `**Description:** ${pattern.description}\n`;
      report += `**Frequency:** ${pattern.frequency} operations\n`;
      report += `**Efficiency:** ${pattern.efficiency}\n`;
      report += `**Purpose:** ${pattern.purpose}\n`;
      report += `**Sources:** ${pattern.filesSources.join(', ')}\n`;
      report += `**Components:** ${pattern.components.join(', ')}\n`;
      
      if (pattern.averageTime) {
        report += `**Average Time:** ${pattern.averageTime.toFixed(2)}ms\n`;
      }
      
      if (pattern.cacheHitRate) {
        report += `**Cache Hit Rate:** ${pattern.cacheHitRate.toFixed(1)}%\n`;
      }
      
      report += `\n`;
    });

    // Efficiency recommendations
    report += `## Efficiency Analysis\n\n`;
    
    const highEfficiency = patterns.filter(p => p.efficiency === 'high');
    const mediumEfficiency = patterns.filter(p => p.efficiency === 'medium');
    const lowEfficiency = patterns.filter(p => p.efficiency === 'low');

    if (lowEfficiency.length > 0) {
      report += `**⚠️ Low Efficiency Patterns (${lowEfficiency.length}):**\n`;
      lowEfficiency.forEach(p => {
        report += `- ${p.pathway}: ${p.description}\n`;
      });
      report += `\n`;
    }

    if (mediumEfficiency.length > 0) {
      report += `**📊 Medium Efficiency Patterns (${mediumEfficiency.length}):**\n`;
      mediumEfficiency.forEach(p => {
        report += `- ${p.pathway}: ${p.description}\n`;
      });
      report += `\n`;
    }

    if (highEfficiency.length > 0) {
      report += `**✅ High Efficiency Patterns (${highEfficiency.length}):**\n`;
      highEfficiency.forEach(p => {
        report += `- ${p.pathway}: ${p.description}\n`;
      });
      report += `\n`;
    }

    return report;
  }
}

// Export global instance
export const referenceAnalyzer = new ReferenceAnalyzer();

// Browser access
if (typeof window !== 'undefined') {
  (window as any).analyzeReferenceLoading = () => referenceAnalyzer.analyzeReferenceColumnLoading();
  (window as any).getReferenceEfficiencyReport = () => referenceAnalyzer.generateEfficiencyReport();
}