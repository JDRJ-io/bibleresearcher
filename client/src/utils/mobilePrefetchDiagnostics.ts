/**
 * Mobile Prefetch Diagnostics Tool
 * 
 * Comprehensive diagnostic tool to investigate mobile prefetch issues
 * Run this on mobile device to gather runtime metrics
 */

import { verseCache } from '@/hooks/data/verseCache';
import { prefetch } from '@/hooks/prefetch/PrefetchManager';

interface DiagnosticReport {
  // 1. Mobile Policy + Constants
  mobilePolicy: {
    renderSize: number;
    safetyPadTop: number;
    safetyPadBot: number;
    bgPadTop: number;
    bgPadBot: number;
    stepSize: number;
    effectiveRowHeightPx: number;
    BASE_ROW_H: number;
    multiplier: number;
    computedWindows: {
      render: [number, number];
      safety: [number, number];
      background: [number, number];
    };
    windowSizes: {
      render: number;
      safety: number;
      background: number;
    };
  };

  // 2. PrefetchManager State
  prefetchManager: {
    concurrencyCap: number;
    currentRunning: number;
    pendingQueueSize: number;
    isDesktop: boolean;
    translationCode: string;
    bgAbortControllerActive: boolean;
  };

  // 3. Velocity & Direction
  velocityMetrics: {
    currentVelocityRps: number;
    direction: 'up' | 'down';
    samples: number[];
    threshold: number;
    multiplier: number;
  };

  // 4. Cache Metrics
  cacheMetrics: {
    totalSize: number;
    highWater: number;
    target: number;
    inFlightCount: number;
    readyCount: number;
    loadingCount: number;
    errorCount: number;
  };

  // 5. Geometry
  geometry: {
    totalRows: number;
    centerIdx: number;
    steppedIdx: number;
    containerHeight: number;
    stickyHeaderOffset: number;
    scrollTop: number;
  };

  // 6. Device Context
  deviceContext: {
    device: string;
    os: string;
    browser: string;
    browserVersion: string;
    windowWidth: number;
    windowHeight: number;
    deviceMemory: number;
    isMobile: boolean;
    isPortrait: boolean;
  };

  // 7. Environment Flags
  envFlags: {
    VITE_LOG_LEVEL?: string;
    VITE_DEBUG_TAGS?: string;
    VITE_LOG_SAMPLE_HOTPATH?: string;
    VITE_LOG_THROTTLE_MS?: string;
  };

  // 8. Recent Activity
  recentActivity: {
    lastDeltas: Array<{
      type: 'safety' | 'background';
      range: [number, number];
      count: number;
      timestamp: number;
    }>;
    lastBatches: Array<{
      priority: 'high' | 'low';
      range: string;
      count: number;
      status: 'started' | 'completed' | 'aborted';
      timestamp: number;
    }>;
  };
}

class MobilePrefetchDiagnostics {
  private deltaHistory: Array<{ type: 'safety' | 'background'; range: [number, number]; count: number; timestamp: number }> = [];
  private batchHistory: Array<{ priority: 'high' | 'low'; range: string; count: number; status: 'started' | 'completed' | 'aborted'; timestamp: number }> = [];
  private velocitySamples: number[] = [];
  
  // Track deltas
  recordDelta(type: 'safety' | 'background', range: [number, number]) {
    this.deltaHistory.push({
      type,
      range,
      count: range[1] - range[0] + 1,
      timestamp: performance.now()
    });
    
    // Keep only last 20
    if (this.deltaHistory.length > 20) {
      this.deltaHistory = this.deltaHistory.slice(-20);
    }
  }

  // Track batches
  recordBatch(priority: 'high' | 'low', range: string, count: number, status: 'started' | 'completed' | 'aborted') {
    this.batchHistory.push({
      priority,
      range,
      count,
      status,
      timestamp: performance.now()
    });
    
    // Keep only last 20
    if (this.batchHistory.length > 20) {
      this.batchHistory = this.batchHistory.slice(-20);
    }
  }

  // Track velocity samples
  recordVelocity(velocity: number) {
    this.velocitySamples.push(velocity);
    
    // Keep only last 10
    if (this.velocitySamples.length > 10) {
      this.velocitySamples = this.velocitySamples.slice(-10);
    }
  }

  // Generate comprehensive diagnostic report
  generateReport(
    centerIdx: number,
    steppedIdx: number,
    velocity: number,
    windows: {
      render: [number, number];
      safety: [number, number];
      background: [number, number];
    },
    totalRows: number,
    rowHeight: number,
    isDesktop: boolean
  ): DiagnosticReport {
    // 1. Mobile Policy
    const isMobile = !isDesktop;
    const renderSize = isDesktop ? 200 : 220;
    const dir = Math.sign(velocity || 0) || 1;
    
    const safetyPadTop = isDesktop ? (dir < 0 ? 300 : 150) : (dir < 0 ? 250 : 130);
    const safetyPadBot = isDesktop ? (dir > 0 ? 400 : 250) : (dir > 0 ? 350 : 200);
    const bgPadTop = isDesktop ? (dir < 0 ? 500 : 250) : (dir < 0 ? 150 : 100);
    const bgPadBot = isDesktop ? (dir > 0 ? 900 : 450) : (dir > 0 ? 150 : 120);

    // 2. Cache metrics - estimate counts based on total size
    const totalCacheSize = verseCache.size();
    const inFlightCount = verseCache.inFlight.size;
    // Rough estimate: total - inFlight = ready (most cached items should be ready)
    const readyCount = Math.max(0, totalCacheSize - inFlightCount);
    const loadingCount = inFlightCount;
    const errorCount = 0; // Not directly accessible without cache internals

    // 3. Device detection
    const ua = navigator.userAgent;
    let device = 'Unknown';
    let os = 'Unknown';
    let browser = 'Unknown';
    let browserVersion = 'Unknown';

    if (/iPhone/.test(ua)) device = 'iPhone';
    else if (/iPad/.test(ua)) device = 'iPad';
    else if (/Android/.test(ua)) device = 'Android';
    
    if (/iPhone|iPad/.test(ua)) os = 'iOS ' + (ua.match(/OS (\d+)_/)?.[1] || '?');
    else if (/Android/.test(ua)) os = 'Android ' + (ua.match(/Android (\d+)/)?.[1] || '?');

    if (/CriOS/.test(ua)) {
      browser = 'Chrome iOS';
      browserVersion = ua.match(/CriOS\/(\d+)/)?.[1] || '?';
    } else if (/Safari/.test(ua) && /Version/.test(ua)) {
      browser = 'Safari';
      browserVersion = ua.match(/Version\/(\d+)/)?.[1] || '?';
    } else if (/Chrome/.test(ua)) {
      browser = 'Chrome';
      browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || '?';
    }

    // 4. Get scroll metrics
    const scrollTop = window.scrollY || 0;
    const containerHeight = window.innerHeight;
    const stickyHeaderOffset = this.getStickyHeaderOffset();

    // 5. Environment flags
    const envFlags = {
      VITE_LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL,
      VITE_DEBUG_TAGS: import.meta.env.VITE_DEBUG_TAGS,
      VITE_LOG_SAMPLE_HOTPATH: import.meta.env.VITE_LOG_SAMPLE_HOTPATH,
      VITE_LOG_THROTTLE_MS: import.meta.env.VITE_LOG_THROTTLE_MS,
    };

    return {
      mobilePolicy: {
        renderSize,
        safetyPadTop,
        safetyPadBot,
        bgPadTop,
        bgPadBot,
        stepSize: 8,
        effectiveRowHeightPx: Math.round(rowHeight),
        BASE_ROW_H: 120,
        multiplier: rowHeight / 120,
        computedWindows: windows,
        windowSizes: {
          render: windows.render[1] - windows.render[0] + 1,
          safety: windows.safety[1] - windows.safety[0] + 1,
          background: windows.background[1] - windows.background[0] + 1,
        }
      },
      prefetchManager: {
        concurrencyCap: isDesktop ? 4 : 2,
        currentRunning: (prefetch as any).running || 0,
        pendingQueueSize: (prefetch as any).pending?.length || 0,
        isDesktop,
        translationCode: (prefetch as any).translationCode || 'KJV',
        bgAbortControllerActive: !!(prefetch as any).bgAbort,
      },
      velocityMetrics: {
        currentVelocityRps: velocity,
        direction: velocity >= 0 ? 'down' : 'up',
        samples: this.velocitySamples.slice(-5),
        threshold: isDesktop ? 20 : 8,
        multiplier: isDesktop ? 1.8 : 2.0,
      },
      cacheMetrics: {
        totalSize: verseCache.size(),
        highWater: isDesktop ? 3000 : 2000,
        target: isDesktop ? 2500 : 1500,
        inFlightCount: verseCache.inFlight.size,
        readyCount,
        loadingCount,
        errorCount,
      },
      geometry: {
        totalRows,
        centerIdx,
        steppedIdx,
        containerHeight,
        stickyHeaderOffset,
        scrollTop,
      },
      deviceContext: {
        device,
        os,
        browser,
        browserVersion,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        deviceMemory: (navigator as any).deviceMemory || 4,
        isMobile,
        isPortrait: window.innerHeight > window.innerWidth,
      },
      envFlags,
      recentActivity: {
        lastDeltas: this.deltaHistory.slice(-10),
        lastBatches: this.batchHistory.slice(-10),
      }
    };
  }

  private getStickyHeaderOffset(): number {
    const isMobile = window.innerWidth <= 768;
    const isPortrait = window.innerHeight > window.innerWidth;
    
    if (!isPortrait) {
      return 138;
    } else if (isMobile) {
      return 138;
    } else {
      return 160;
    }
  }

  // Pretty print report to console
  printReport(report: DiagnosticReport) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 MOBILE PREFETCH DIAGNOSTICS REPORT');
    console.log('═══════════════════════════════════════════════════════════');
    
    console.log('\n0️⃣  DEVICE CONTEXT');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`Device: ${report.deviceContext.device}`);
    console.log(`OS: ${report.deviceContext.os}`);
    console.log(`Browser: ${report.deviceContext.browser} ${report.deviceContext.browserVersion}`);
    console.log(`Screen: ${report.deviceContext.windowWidth}×${report.deviceContext.windowHeight} (${report.deviceContext.isPortrait ? 'portrait' : 'landscape'})`);
    console.log(`Device Memory: ${report.deviceContext.deviceMemory}GB`);
    console.log(`Detected as: ${report.deviceContext.isMobile ? 'MOBILE' : 'DESKTOP'}`);

    console.log('\n1️⃣  MOBILE POLICY + CONSTANTS');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`Render Size: ${report.mobilePolicy.renderSize} verses`);
    console.log(`Safety Pads: top=${report.mobilePolicy.safetyPadTop}, bot=${report.mobilePolicy.safetyPadBot}`);
    console.log(`Background Pads: top=${report.mobilePolicy.bgPadTop}, bot=${report.mobilePolicy.bgPadBot}`);
    console.log(`Step Size: ${report.mobilePolicy.stepSize} rows`);
    console.log(`Row Height: ${report.mobilePolicy.effectiveRowHeightPx}px (base=${report.mobilePolicy.BASE_ROW_H}, mult=${report.mobilePolicy.multiplier.toFixed(2)})`);
    console.log('\nComputed Windows:');
    console.log(`  Render:     [${report.mobilePolicy.computedWindows.render[0]}, ${report.mobilePolicy.computedWindows.render[1]}] = ${report.mobilePolicy.windowSizes.render} verses`);
    console.log(`  Safety:     [${report.mobilePolicy.computedWindows.safety[0]}, ${report.mobilePolicy.computedWindows.safety[1]}] = ${report.mobilePolicy.windowSizes.safety} verses`);
    console.log(`  Background: [${report.mobilePolicy.computedWindows.background[0]}, ${report.mobilePolicy.computedWindows.background[1]}] = ${report.mobilePolicy.windowSizes.background} verses`);

    console.log('\n2️⃣  PREFETCH MANAGER STATE');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`Concurrency Cap: ${report.prefetchManager.concurrencyCap} (${report.prefetchManager.isDesktop ? 'desktop' : 'mobile'})`);
    console.log(`Currently Running: ${report.prefetchManager.currentRunning}/${report.prefetchManager.concurrencyCap}`);
    console.log(`Pending Queue Size: ${report.prefetchManager.pendingQueueSize}`);
    console.log(`Translation: ${report.prefetchManager.translationCode}`);
    console.log(`BG AbortController Active: ${report.prefetchManager.bgAbortControllerActive}`);

    console.log('\n3️⃣  VELOCITY & DIRECTION');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`Current Velocity: ${report.velocityMetrics.currentVelocityRps.toFixed(2)} rps`);
    console.log(`Direction: ${report.velocityMetrics.direction}`);
    console.log(`Recent Samples (last 5): ${report.velocityMetrics.samples.map(v => v.toFixed(1)).join(', ')}`);
    console.log(`Velocity Threshold: ${report.velocityMetrics.threshold} rps`);
    console.log(`Velocity Multiplier: ${report.velocityMetrics.multiplier}×`);

    console.log('\n4️⃣  DELTA COMPUTATION (Last 10)');
    console.log('─────────────────────────────────────────────────────────');
    if (report.recentActivity.lastDeltas.length === 0) {
      console.log('No recent deltas recorded');
    } else {
      report.recentActivity.lastDeltas.forEach((delta, i) => {
        const elapsed = ((performance.now() - delta.timestamp) / 1000).toFixed(1);
        console.log(`  ${i + 1}. ${delta.type.toUpperCase()}: [${delta.range[0]}, ${delta.range[1]}] = ${delta.count} verses (${elapsed}s ago)`);
      });
    }

    console.log('\n5️⃣  CACHE METRICS');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`Total Cache Size: ${report.cacheMetrics.totalSize} entries`);
    console.log(`High Water: ${report.cacheMetrics.highWater} | Target: ${report.cacheMetrics.target}`);
    console.log(`In-Flight: ${report.cacheMetrics.inFlightCount}`);
    console.log(`Status Breakdown: ready=${report.cacheMetrics.readyCount}, loading=${report.cacheMetrics.loadingCount}, error=${report.cacheMetrics.errorCount}`);
    console.log(`Utilization: ${((report.cacheMetrics.totalSize / report.cacheMetrics.highWater) * 100).toFixed(1)}%`);

    console.log('\n6️⃣  BATCH ACTIVITY (Last 10)');
    console.log('─────────────────────────────────────────────────────────');
    if (report.recentActivity.lastBatches.length === 0) {
      console.log('No recent batches recorded');
    } else {
      const batchStats = this.calculateBatchStats(report.recentActivity.lastBatches);
      report.recentActivity.lastBatches.forEach((batch, i) => {
        const elapsed = ((performance.now() - batch.timestamp) / 1000).toFixed(1);
        console.log(`  ${i + 1}. ${batch.priority.toUpperCase()}: ${batch.range} (${batch.count} verses) - ${batch.status} (${elapsed}s ago)`);
      });
      console.log(`\nBatch Stats: avg=${batchStats.avgSize.toFixed(0)} verses, high=${batchStats.highCount}, low=${batchStats.lowCount}, aborted=${batchStats.abortedCount}`);
    }

    console.log('\n7️⃣  GEOMETRY');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`Total Rows: ${report.geometry.totalRows}`);
    console.log(`Center Index: ${report.geometry.centerIdx}`);
    console.log(`Stepped Index: ${report.geometry.steppedIdx}`);
    console.log(`Container Height: ${report.geometry.containerHeight}px`);
    console.log(`Sticky Header Offset: ${report.geometry.stickyHeaderOffset}px`);
    console.log(`Scroll Top: ${report.geometry.scrollTop}px`);

    console.log('\n8️⃣  ENVIRONMENT FLAGS');
    console.log('─────────────────────────────────────────────────────────');
    Object.entries(report.envFlags).forEach(([key, val]) => {
      console.log(`${key}: ${val || 'not set'}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📋 Full report object available as: window.__PREFETCH_DIAGNOSTICS__');
    console.log('═══════════════════════════════════════════════════════════\n');
  }

  private calculateBatchStats(batches: any[]) {
    const sizes = batches.map(b => b.count);
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length || 0;
    const highCount = batches.filter(b => b.priority === 'high').length;
    const lowCount = batches.filter(b => b.priority === 'low').length;
    const abortedCount = batches.filter(b => b.status === 'aborted').length;
    
    return { avgSize, highCount, lowCount, abortedCount };
  }

  // Export report to clipboard
  async copyReportToClipboard(report: DiagnosticReport) {
    const text = JSON.stringify(report, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      console.log('✅ Report copied to clipboard!');
    } catch (err) {
      console.error('❌ Failed to copy to clipboard:', err);
      console.log('📋 Report text:', text);
    }
  }
}

export const mobileDiagnostics = new MobilePrefetchDiagnostics();

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).__mobileDiagnostics__ = mobileDiagnostics;
}
