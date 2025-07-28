// Format Conversion Pattern Analyzer
// Uses global logger to identify space-to-period conversion patterns

import { globalLogger } from './globalLogger';

export interface ConversionPattern {
  file: string;
  lineNumber?: number;
  function: string;
  pattern: 'space-to-dot' | 'dot-to-space' | 'bidirectional' | 'straight-line';
  implementation: 'OLD_METHOD' | 'STRAIGHT_LINE' | 'PERIPHERAL';
  code: string;
  purpose: string;
  impact: 'CRITICAL' | 'MODERATE' | 'LOW';
  status: 'CONVERTED' | 'NEEDS_CONVERSION' | 'INTENTIONALLY_KEPT';
}

export class FormatConversionAnalyzer {
  private conversionPatterns: ConversionPattern[] = [];

  constructor() {
    this.analyzeCodebase();
  }

  private analyzeCodebase() {
    // Manual analysis based on the grep results and codebase knowledge
    this.conversionPatterns = [
      // STRAIGHT-LINE IMPLEMENTATIONS (CONVERTED)
      {
        file: 'data/BibleDataAPI.ts',
        lineNumber: 470,
        function: 'getCrossReferences',
        pattern: 'space-to-dot',
        implementation: 'STRAIGHT_LINE',
        code: 'const searchKey = verseId.replace(/\\s/g, ".");',
        purpose: 'Single conversion at API boundary for cross-reference lookup',
        impact: 'LOW',
        status: 'CONVERTED'
      },
      {
        file: 'hooks/useBibleData.ts',
        function: 'getVerseText',
        pattern: 'straight-line',
        implementation: 'STRAIGHT_LINE',
        code: 'Direct lookup with dot format - no conversion needed',
        purpose: 'Master cache direct access',
        impact: 'CRITICAL',
        status: 'CONVERTED'
      },
      {
        file: 'lib/translationLoader.ts',
        function: 'getVerseText',
        pattern: 'straight-line',
        implementation: 'STRAIGHT_LINE',
        code: 'Direct lookup with dot format - no conversion needed',
        purpose: 'Translation map direct access',
        impact: 'CRITICAL',
        status: 'CONVERTED'
      },

      // OLD METHOD IMPLEMENTATIONS (NEEDS CONVERSION)
      {
        file: 'App.tsx',
        lineNumber: 153,
        function: 'App navigation',
        pattern: 'bidirectional',
        implementation: 'OLD_METHOD',
        code: 'const spaceFormat = id.replace(".", " "); const dotFormat = id.replace(" ", ".");',
        purpose: 'URL handling and navigation',
        impact: 'MODERATE',
        status: 'NEEDS_CONVERSION'
      },
      {
        file: 'components/bible/VirtualBibleTable.tsx',
        lineNumber: 237,
        function: 'onVerseClick',
        pattern: 'bidirectional',
        implementation: 'OLD_METHOD',
        code: 'ref.replace(/\\s/g, "."), ref.replace(/\\./g, " ")',
        purpose: 'Defensive navigation format attempts',
        impact: 'MODERATE',
        status: 'NEEDS_CONVERSION'
      },
      {
        file: 'hooks/useBibleData.ts',
        lineNumber: 735,
        function: 'getCrossRefText',
        pattern: 'space-to-dot',
        implementation: 'OLD_METHOD',
        code: 'const dotRef = verseRef.replace(" ", ".").replace(":", ":");',
        purpose: 'Cross-reference text loading',
        impact: 'MODERATE',
        status: 'NEEDS_CONVERSION'
      },
      {
        file: 'hooks/useBibleData.ts',
        lineNumber: 1091,
        function: 'findVerseInPreloadedTranslations',
        pattern: 'space-to-dot',
        implementation: 'OLD_METHOD',
        code: '=== reference.replace(/\\s/g, ".")',
        purpose: 'Verse lookup in preloaded translations',
        impact: 'MODERATE',
        status: 'NEEDS_CONVERSION'
      },

      // PERIPHERAL IMPLEMENTATIONS (INTENTIONALLY KEPT)
      {
        file: 'lib/bibleSearchEngine.ts',
        lineNumber: 237,
        function: 'indexVerses',
        pattern: 'bidirectional',
        implementation: 'PERIPHERAL',
        code: 'this.verseMap.set(ref.replace(".", " "), index); this.verseMap.set(ref.replace(" ", "."), index);',
        purpose: 'Search index supports both formats for user flexibility',
        impact: 'LOW',
        status: 'INTENTIONALLY_KEPT'
      },
      {
        file: 'data/BibleDataAPI.ts',
        lineNumber: 404,
        function: 'loadProphecyData',
        pattern: 'bidirectional',
        implementation: 'PERIPHERAL',
        code: 'verseRoles[baseVerse.replace(/\\./g, " ")] = roles; verseRoles[baseVerse.replace(/\\s/g, ".")] = roles;',
        purpose: 'Prophecy data lookup flexibility',
        impact: 'LOW',
        status: 'INTENTIONALLY_KEPT'
      },
      {
        file: 'lib/labelsCache.ts',
        lineNumber: 19,
        function: 'convertRef',
        pattern: 'space-to-dot',
        implementation: 'PERIPHERAL',
        code: 'return clean.replace(" ", ".");',
        purpose: 'Label cache key normalization',
        impact: 'LOW',
        status: 'INTENTIONALLY_KEPT'
      }
    ];
  }

  // Use global logger to identify runtime conversion patterns
  analyzeRuntimeConversions() {
    const logs = globalLogger.exportLogs();
    const conversionLogs = logs.logs.filter(log => 
      log.details && (
        JSON.stringify(log.details).includes('replace') ||
        log.operation.includes('convert') ||
        log.operation.includes('format')
      )
    );

    console.log('🔍 RUNTIME CONVERSION ANALYSIS:');
    console.log(`Found ${conversionLogs.length} potential conversion operations in logs`);
    
    const conversionsByComponent = conversionLogs.reduce((acc, log) => {
      const component = log.component || 'unknown';
      if (!acc[component]) acc[component] = [];
      acc[component].push(log);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      totalConversions: conversionLogs.length,
      byComponent: conversionsByComponent,
      recentConversions: conversionLogs.slice(-10)
    };
  }

  // Generate comprehensive report
  generateReport() {
    const runtimeAnalysis = this.analyzeRuntimeConversions();
    
    const straightLineCount = this.conversionPatterns.filter(p => p.implementation === 'STRAIGHT_LINE').length;
    const oldMethodCount = this.conversionPatterns.filter(p => p.implementation === 'OLD_METHOD').length;
    const peripheralCount = this.conversionPatterns.filter(p => p.implementation === 'PERIPHERAL').length;

    const report = {
      summary: {
        title: '🔍 FORMAT CONVERSION ANALYSIS REPORT',
        subtitle: 'Global Logger Analysis of Space-to-Period Conversion Patterns',
        totalPatterns: this.conversionPatterns.length,
        straightLineImplemented: straightLineCount,
        oldMethodRemaining: oldMethodCount,
        peripheralKept: peripheralCount,
        conversionProgress: `${Math.round((straightLineCount / this.conversionPatterns.length) * 100)}%`
      },
      
      straightLineImplementations: this.conversionPatterns.filter(p => p.implementation === 'STRAIGHT_LINE'),
      oldMethodImplementations: this.conversionPatterns.filter(p => p.implementation === 'OLD_METHOD'),
      peripheralImplementations: this.conversionPatterns.filter(p => p.implementation === 'PERIPHERAL'),
      
      runtimeAnalysis,
      
      recommendations: [
        {
          priority: 'HIGH',
          target: 'App.tsx navigation',
          action: 'Convert to single dot format for URL handling',
          impact: 'Eliminates bidirectional conversion in main navigation'
        },
        {
          priority: 'HIGH', 
          target: 'VirtualBibleTable.tsx onVerseClick',
          action: 'Use direct dot format lookup instead of multiple format attempts',
          impact: 'Eliminates defensive conversion patterns'
        },
        {
          priority: 'MEDIUM',
          target: 'useBibleData.ts cross-reference functions',
          action: 'Convert to use dot format directly from BibleDataAPI',
          impact: 'Reduces redundant conversions in cross-reference loading'
        },
        {
          priority: 'LOW',
          target: 'Search and peripheral systems',
          action: 'Keep bidirectional support for user flexibility',
          impact: 'Maintains user experience while core pipeline stays optimized'
        }
      ]
    };

    return report;
  }

  // Console output for immediate analysis
  logAnalysis() {
    const report = this.generateReport();
    
    console.log('\n' + '='.repeat(80));
    console.log(report.summary.title);
    console.log(report.summary.subtitle);
    console.log('='.repeat(80));
    
    console.log(`\n📊 CONVERSION PROGRESS: ${report.summary.conversionProgress}`);
    console.log(`✅ Straight-line: ${report.summary.straightLineImplemented}/${report.summary.totalPatterns}`);
    console.log(`⚠️  Old method: ${report.summary.oldMethodRemaining}/${report.summary.totalPatterns}`);
    console.log(`🔧 Peripheral: ${report.summary.peripheralKept}/${report.summary.totalPatterns}`);
    
    console.log('\n🎯 STRAIGHT-LINE IMPLEMENTATIONS (CONVERTED):');
    report.straightLineImplementations.forEach(impl => {
      console.log(`  ✅ ${impl.file}:${impl.function} - ${impl.purpose}`);
    });
    
    console.log('\n⚠️ OLD METHOD IMPLEMENTATIONS (NEEDS CONVERSION):');
    report.oldMethodImplementations.forEach(impl => {
      console.log(`  🔄 ${impl.file}:${impl.function} - ${impl.purpose}`);
      console.log(`     Code: ${impl.code}`);
    });
    
    console.log('\n🔧 PERIPHERAL IMPLEMENTATIONS (INTENTIONALLY KEPT):');
    report.peripheralImplementations.forEach(impl => {
      console.log(`  🔧 ${impl.file}:${impl.function} - ${impl.purpose}`);
    });
    
    console.log('\n🎯 HIGH PRIORITY RECOMMENDATIONS:');
    report.recommendations
      .filter(r => r.priority === 'HIGH')
      .forEach(rec => {
        console.log(`  🎯 ${rec.target}: ${rec.action}`);
        console.log(`     Impact: ${rec.impact}`);
      });
      
    console.log('\n📊 RUNTIME CONVERSION ACTIVITY:');
    console.log(`  Total conversions detected: ${report.runtimeAnalysis.totalConversions}`);
    console.log(`  Active components: ${Object.keys(report.runtimeAnalysis.byComponent).length}`);
    
    return report;
  }
}

// Create global instance and expose to window for browser console access
export const formatConversionAnalyzer = new FormatConversionAnalyzer();

// Browser console access
if (typeof window !== 'undefined') {
  (window as any).analyzeFormatConversions = () => formatConversionAnalyzer.logAnalysis();
  (window as any).getFormatConversionReport = () => formatConversionAnalyzer.generateReport();
}