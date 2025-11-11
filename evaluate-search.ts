import { parseReferences, toKeys, formatKey } from './client/src/lib/bible-reference-parser';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestQuery {
  category: string;
  query: string;
  expected: string;
  description: string;
}

interface TestResult {
  category: string;
  query: string;
  expected: string;
  actual: string[];
  passed: boolean;
  latencyMs: number;
  confidence: number;
  reason: string;
  description: string;
}

interface CategoryStats {
  category: string;
  total: number;
  passed: number;
  failed: number;
  avgLatency: number;
  accuracy: number;
}

class SearchAuditor {
  private results: TestResult[] = [];
  
  async runAudit(): Promise<void> {
    console.log('📊 Bible Search Audit Starting...\n');
    
    // Load test queries
    const queries = this.loadQueries();
    console.log(`✅ Loaded ${queries.length} test queries\n`);
    
    // Run each query
    for (const query of queries) {
      const result = await this.testQuery(query);
      this.results.push(result);
      
      // Log progress
      const icon = result.passed ? '✓' : '✗';
      const status = result.passed ? 'PASS' : 'FAIL';
      console.log(`${icon} ${status} | ${query.category.padEnd(25)} | ${query.query.padEnd(30)} | ${result.reason}`);
    }
    
    console.log('\n');
    
    // Generate reports
    this.generateReports();
  }
  
  private loadQueries(): TestQuery[] {
    const filePath = path.join(__dirname, 'test-queries.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }
  
  private async testQuery(query: TestQuery): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Use the bible-reference-parser to parse the query
      const parsed = parseReferences(query.query);
      const keys = toKeys(parsed);
      
      const latencyMs = Date.now() - startTime;
      
      // Check if we got the expected result
      const expectedNormalized = this.normalizeReference(query.expected);
      const actualNormalized = keys.map(k => this.normalizeReference(k));
      
      // A pass means the expected reference is in the actual results (first position preferred)
      const passed = actualNormalized.length > 0 && 
                     actualNormalized[0] === expectedNormalized;
      
      // Calculate confidence based on parser output
      const confidence = parsed.length > 0 ? 0.95 : 0.0;
      
      // Determine reason
      let reason = '';
      if (passed) {
        reason = keys.length === 1 ? 'Exact match' : `Matched (returned ${keys.length} refs)`;
      } else if (keys.length === 0) {
        reason = 'No results - parser failed';
      } else if (actualNormalized.includes(expectedNormalized)) {
        reason = `Found but not first (position ${actualNormalized.indexOf(expectedNormalized) + 1})`;
      } else {
        reason = `Wrong reference: got ${keys[0] || 'none'}`;
      }
      
      return {
        category: query.category,
        query: query.query,
        expected: query.expected,
        actual: keys,
        passed,
        latencyMs,
        confidence,
        reason,
        description: query.description
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      return {
        category: query.category,
        query: query.query,
        expected: query.expected,
        actual: [],
        passed: false,
        latencyMs,
        confidence: 0,
        reason: `Parser error: ${error instanceof Error ? error.message : String(error)}`,
        description: query.description
      };
    }
  }
  
  private normalizeReference(ref: string): string {
    // Normalize references for comparison
    // e.g., "John.3.16" vs "John.3:16" should be equivalent
    return ref.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[.:]/g, '.')
      .replace(/–/g, '-');
  }
  
  private generateReports(): void {
    // Calculate overall stats
    const totalQueries = this.results.length;
    const passedQueries = this.results.filter(r => r.passed).length;
    const failedQueries = totalQueries - passedQueries;
    const overallAccuracy = (passedQueries / totalQueries) * 100;
    const avgLatency = this.results.reduce((sum, r) => sum + r.latencyMs, 0) / totalQueries;
    
    // Calculate category stats
    const categoryMap = new Map<string, TestResult[]>();
    this.results.forEach(result => {
      if (!categoryMap.has(result.category)) {
        categoryMap.set(result.category, []);
      }
      categoryMap.get(result.category)!.push(result);
    });
    
    const categoryStats: CategoryStats[] = Array.from(categoryMap.entries()).map(([category, results]) => {
      const total = results.length;
      const passed = results.filter(r => r.passed).length;
      const failed = total - passed;
      const avgLatency = results.reduce((sum, r) => sum + r.latencyMs, 0) / total;
      const accuracy = (passed / total) * 100;
      
      return { category, total, passed, failed, avgLatency, accuracy };
    });
    
    // Sort categories by accuracy (worst first)
    categoryStats.sort((a, b) => a.accuracy - b.accuracy);
    
    // Generate CSV report
    this.generateCSVReport();
    
    // Generate summary report
    this.generateSummaryReport(totalQueries, passedQueries, failedQueries, overallAccuracy, avgLatency, categoryStats);
    
    console.log('📄 Reports generated:');
    console.log('  - search-audit-report.csv');
    console.log('  - search-audit-summary.txt');
  }
  
  private generateCSVReport(): void {
    const csvLines = [
      'Category,Query,Expected,Actual,Status,Latency (ms),Confidence,Reason,Description'
    ];
    
    this.results.forEach(result => {
      const status = result.passed ? 'PASS' : 'FAIL';
      const actual = result.actual.length > 0 ? result.actual[0] : '';
      csvLines.push([
        result.category,
        result.query,
        result.expected,
        actual,
        status,
        result.latencyMs.toFixed(2),
        result.confidence.toFixed(2),
        result.reason,
        result.description
      ].map(v => `"${v}"`).join(','));
    });
    
    fs.writeFileSync('search-audit-report.csv', csvLines.join('\n'));
  }
  
  private generateSummaryReport(
    totalQueries: number,
    passedQueries: number,
    failedQueries: number,
    overallAccuracy: number,
    avgLatency: number,
    categoryStats: CategoryStats[]
  ): void {
    const lines: string[] = [];
    
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('        BIBLE SEARCH ENGINE AUDIT REPORT');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('');
    
    lines.push('OVERALL PERFORMANCE');
    lines.push('─────────────────────────────────────────────────────');
    lines.push(`Total Queries:        ${totalQueries}`);
    lines.push(`Passed:               ${passedQueries} ✓`);
    lines.push(`Failed:               ${failedQueries} ✗`);
    lines.push(`Overall Accuracy:     ${overallAccuracy.toFixed(1)}%`);
    lines.push(`Average Latency:      ${avgLatency.toFixed(2)}ms`);
    lines.push('');
    
    lines.push('ACCURACY BY CATEGORY');
    lines.push('─────────────────────────────────────────────────────');
    categoryStats.forEach(stat => {
      const bar = this.generateProgressBar(stat.accuracy, 30);
      lines.push(`${stat.category.padEnd(30)} ${bar} ${stat.accuracy.toFixed(1)}% (${stat.passed}/${stat.total})`);
    });
    lines.push('');
    
    lines.push('LATENCY DISTRIBUTION');
    lines.push('─────────────────────────────────────────────────────');
    const latencies = this.results.map(r => r.latencyMs).sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p90 = latencies[Math.floor(latencies.length * 0.9)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];
    lines.push(`P50 (median):         ${p50.toFixed(2)}ms`);
    lines.push(`P90:                  ${p90.toFixed(2)}ms`);
    lines.push(`P95:                  ${p95.toFixed(2)}ms`);
    lines.push(`P99:                  ${p99.toFixed(2)}ms`);
    lines.push('');
    
    lines.push('FAILURE ANALYSIS');
    lines.push('─────────────────────────────────────────────────────');
    const failedResults = this.results.filter(r => !r.passed);
    
    if (failedResults.length === 0) {
      lines.push('✨ No failures! Perfect score!');
    } else {
      // Group failures by reason
      const failureReasons = new Map<string, number>();
      failedResults.forEach(result => {
        const key = result.reason;
        failureReasons.set(key, (failureReasons.get(key) || 0) + 1);
      });
      
      // Sort by frequency
      const sortedReasons = Array.from(failureReasons.entries())
        .sort((a, b) => b[1] - a[1]);
      
      sortedReasons.forEach(([reason, count]) => {
        lines.push(`${count.toString().padStart(3)}× ${reason}`);
      });
      
      lines.push('');
      lines.push('Sample Failures:');
      failedResults.slice(0, 10).forEach((result, i) => {
        lines.push(`  ${i + 1}. "${result.query}" → expected "${result.expected}", got "${result.actual[0] || 'none'}"`);
        lines.push(`     Category: ${result.category} | Reason: ${result.reason}`);
      });
    }
    lines.push('');
    
    lines.push('RECOMMENDATIONS');
    lines.push('─────────────────────────────────────────────────────');
    
    // Generate specific recommendations based on failures
    const recommendations = this.generateRecommendations(categoryStats, failedResults);
    recommendations.forEach((rec, i) => {
      lines.push(`${i + 1}. ${rec}`);
    });
    
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');
    
    fs.writeFileSync('search-audit-summary.txt', lines.join('\n'));
  }
  
  private generateProgressBar(percentage: number, width: number): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }
  
  private generateRecommendations(categoryStats: CategoryStats[], failedResults: TestResult[]): string[] {
    const recommendations: string[] = [];
    
    // Check for category-specific issues
    const weakCategories = categoryStats.filter(s => s.accuracy < 80);
    
    if (weakCategories.length > 0) {
      weakCategories.forEach(cat => {
        if (cat.category === 'Typos and Fuzzy') {
          recommendations.push(`Add fuzzy matching support for typos (currently ${cat.accuracy.toFixed(1)}% accuracy)`);
        } else if (cat.category === 'Alternate Book Names') {
          recommendations.push(`Expand book name aliases to include ${cat.category} (currently ${cat.accuracy.toFixed(1)}% accuracy)`);
        } else if (cat.category === 'Compact Format') {
          recommendations.push(`Improve compact format parsing (e.g., "John316") (currently ${cat.accuracy.toFixed(1)}% accuracy)`);
        } else if (cat.category.includes('Range')) {
          recommendations.push(`Enhance range parsing for ${cat.category} (currently ${cat.accuracy.toFixed(1)}% accuracy)`);
        } else {
          recommendations.push(`Improve ${cat.category} parsing (currently ${cat.accuracy.toFixed(1)}% accuracy)`);
        }
      });
    }
    
    // Check for parser failures
    const parserFailures = failedResults.filter(r => r.reason.includes('parser failed'));
    if (parserFailures.length > 0) {
      recommendations.push(`Fix parser failures (${parserFailures.length} queries returning no results)`);
    }
    
    // Check for wrong results
    const wrongResults = failedResults.filter(r => r.reason.includes('Wrong reference'));
    if (wrongResults.length > 0) {
      recommendations.push(`Review reference normalization (${wrongResults.length} queries returning wrong references)`);
    }
    
    // General performance
    if (recommendations.length === 0) {
      recommendations.push('🎉 Excellent performance! Consider edge case testing for production readiness');
    }
    
    return recommendations;
  }
}

// Run the audit
const auditor = new SearchAuditor();
auditor.runAudit().then(() => {
  console.log('\n✅ Search audit complete!\n');
}).catch(error => {
  console.error('❌ Audit failed:', error);
  process.exit(1);
});
