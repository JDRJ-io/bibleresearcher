/**
 * Global diagnostic helpers - attach to window for console access
 */

import { mobileDiagnostics } from './mobilePrefetchDiagnostics';

// Global function to run diagnostics - callable from browser console
export function setupGlobalDiagnostics() {
  if (typeof window === 'undefined') return;

  // Helper to get current virtualization state
  (window as any).__runMobileDiagnostics__ = (options?: { 
    copy?: boolean;
    print?: boolean;
  }) => {
    const opts = {
      copy: options?.copy ?? false,
      print: options?.print ?? true,
    };

    // Try to get current state from the virtualization system
    // This will be populated by the VirtualBibleTable component
    const state = (window as any).__VIRTUALIZATION_STATE__;
    
    if (!state) {
      console.error('❌ Virtualization state not available. Make sure you are on the Bible page and scrolling is active.');
      console.log('💡 Try scrolling a bit first to activate the virtualization system.');
      return null;
    }

    const report = mobileDiagnostics.generateReport(
      state.centerIdx,
      state.steppedIdx,
      state.velocity,
      state.windows,
      state.totalRows,
      state.rowHeight,
      state.isDesktop
    );

    // Store report globally for inspection
    (window as any).__PREFETCH_DIAGNOSTICS__ = report;

    if (opts.print) {
      mobileDiagnostics.printReport(report);
    }

    if (opts.copy) {
      mobileDiagnostics.copyReportToClipboard(report);
    }

    return report;
  };

  // Helper to continuously monitor (for flick testing)
  (window as any).__startMonitoring__ = (intervalMs = 1000) => {
    console.log(`🔍 Starting mobile diagnostics monitoring (every ${intervalMs}ms)`);
    console.log('📋 Call __stopMonitoring__() to stop');
    
    const intervalId = setInterval(() => {
      (window as any).__runMobileDiagnostics__({ print: false });
      const report = (window as any).__PREFETCH_DIAGNOSTICS__;
      
      if (report) {
        console.log(`📊 [${new Date().toISOString().slice(11, 23)}] v=${report.velocityMetrics.currentVelocityRps.toFixed(1)} rps | cache=${report.cacheMetrics.totalSize} | batches=${report.recentActivity.lastBatches.length}`);
      }
    }, intervalMs);

    (window as any).__MONITORING_INTERVAL__ = intervalId;
    (window as any).__stopMonitoring__ = () => {
      clearInterval((window as any).__MONITORING_INTERVAL__);
      console.log('✅ Monitoring stopped');
      delete (window as any).__MONITORING_INTERVAL__;
      delete (window as any).__stopMonitoring__;
    };
  };

  // Quick diagnostic commands (from analysis feedback)
  (window as any).__quickCheck__ = () => {
    const rowH = (window as any).__ROW_H__?.() || 120;
    const container = document.getElementById('virtual-bible-scroll');
    const containerHeight = container?.clientHeight || 0;
    const sticky = (window as any).__stickyHeaderOffset || 0;
    
    console.log('📏 ROW HEIGHT CHECK:', {
      effectiveRowHeightPx: rowH,
      containerHeight,
      stickyHeaderOffset: sticky,
      visibleRows: Math.floor(containerHeight / rowH)
    });
    
    return { 
      EFFECTIVE_ROW_H: rowH, 
      containerHeight, 
      sticky 
    };
  };

  (window as any).__velocityTest__ = () => {
    console.log('🏃 Starting velocity test... Scroll/flick now!');
    (window as any).__startMonitoring__(300);
    setTimeout(() => {
      (window as any).__stopMonitoring__();
      const diag = (window as any).__PREFETCH_DIAGNOSTICS__;
      console.log('📊 Velocity samples:', diag?.velocityMetrics?.samples);
      console.log('📊 Current velocity:', diag?.velocityMetrics?.currentVelocityRps, 'rps');
      return diag?.velocityMetrics;
    }, 2000);
  };

  // Print usage instructions
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 MOBILE PREFETCH DIAGNOSTICS TOOLS READY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('Available commands (paste in browser console):');
  console.log('');
  console.log('1. Run diagnostics once:');
  console.log('   __runMobileDiagnostics__()');
  console.log('');
  console.log('2. Run and copy to clipboard:');
  console.log('   __runMobileDiagnostics__({ copy: true })');
  console.log('');
  console.log('3. Run without printing (just store):');
  console.log('   __runMobileDiagnostics__({ print: false })');
  console.log('');
  console.log('4. Start continuous monitoring:');
  console.log('   __startMonitoring__(1000)  // every 1 second');
  console.log('');
  console.log('5. Stop monitoring:');
  console.log('   __stopMonitoring__()');
  console.log('');
  console.log('6. Access last report object:');
  console.log('   window.__PREFETCH_DIAGNOSTICS__');
  console.log('');
  console.log('🔧 QUICK DIAGNOSTIC CHECKS:');
  console.log('   __quickCheck__()        // Check row height & container');
  console.log('   __velocityTest__()      // Test velocity tracking (2s)');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
}
