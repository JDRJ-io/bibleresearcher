// Real-time conversion analysis using global logger
import { globalLogger } from './globalLogger';

export function analyzeCurrentConversions() {
  const logs = globalLogger.exportLogs();
  
  console.log('🔍 GLOBAL LOGGER RUNTIME ANALYSIS');
  console.log('=====================================');
  
  // Look for actual conversion operations in the logs
  const conversionLogs = logs.logs.filter(log => {
    const details = JSON.stringify(log.details || {});
    return details.includes('replace') || 
           log.operation.includes('convert') ||
           log.operation.includes('format') ||
           details.includes('space') ||
           details.includes('dot');
  });
  
  console.log(`Found ${conversionLogs.length} conversion-related log entries`);
  
  // Group by component
  const byComponent = conversionLogs.reduce((acc, log) => {
    const component = log.component || 'unknown';
    if (!acc[component]) acc[component] = [];
    acc[component].push(log);
    return acc;
  }, {} as Record<string, any[]>);
  
  console.log('\n🎯 COMPONENTS WITH ACTIVE CONVERSIONS:');
  Object.entries(byComponent).forEach(([component, logs]) => {
    console.log(`- ${component}: ${logs.length} conversion operations`);
  });
  
  // Look for specific reference format operations
  const refFormatLogs = logs.logs.filter(log => 
    log.subcategory === 'reference-format' || 
    log.operation.includes('reference') ||
    (log.details && (log.details.reference || log.details.verseRef))
  );
  
  console.log(`\n📋 REFERENCE FORMAT OPERATIONS: ${refFormatLogs.length}`);
  
  return {
    totalConversions: conversionLogs.length,
    byComponent,
    referenceFormatOps: refFormatLogs.length,
    recentActivity: conversionLogs.slice(-5)
  };
}

// Expose to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).analyzeCurrentConversions = analyzeCurrentConversions;
}