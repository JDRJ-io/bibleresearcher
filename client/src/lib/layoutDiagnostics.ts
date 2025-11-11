/**
 * Layout Diagnostics System
 * Tracks all layout recalculations with timestamps, reasons, and multiplier values
 */

import { logger } from './logger';

let layoutSeq = 0;

const ts = () => {
  const now = new Date();
  return now.toISOString().split('T')[1].slice(0, 12); // HH:MM:SS.mmm
};

const getMultipliers = () => {
  if (typeof document === 'undefined') return { col: '?', text: '?', row: '?' };
  
  const style = getComputedStyle(document.documentElement);
  return {
    col: style.getPropertyValue('--column-width-mult').trim() || 'unset',
    text: style.getPropertyValue('--text-size-mult').trim() || 'unset',
    row: style.getPropertyValue('--row-height-mult').trim() || 'unset',
  };
};

export interface LayoutLogData {
  [key: string]: any;
}

export const logLayout = (reason: string, data: LayoutLogData = {}) => {
  const seq = ++layoutSeq;
  const timestamp = ts();
  const mult = getMultipliers();
  const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
  
  logger.debug(
    'LAYOUT',
    `#${seq} ${timestamp} ${reason}`,
    {
      multipliers: mult,
      viewport: { w: vw, h: vh },
      ...data
    },
    { throttleMs: 100 }
  );
};

// Track last dimensions to detect tiny mobile viewport changes
let lastW = 0;
let lastH = 0;

export const hasSignificantResize = (threshold = { width: 0.02, height: 0.05 }): boolean => {
  if (typeof window === 'undefined') return false;
  
  const w = window.innerWidth;
  const h = window.innerHeight;
  
  if (lastW === 0 && lastH === 0) {
    lastW = w;
    lastH = h;
    return true; // First measurement
  }
  
  const dw = Math.abs(w - lastW) / Math.max(1, lastW);
  const dh = Math.abs(h - lastH) / Math.max(1, lastH);
  
  const isSignificant = dw >= threshold.width || dh >= threshold.height;
  
  if (isSignificant) {
    lastW = w;
    lastH = h;
  }
  
  return isSignificant;
};

export const resetDimensions = () => {
  lastW = 0;
  lastH = 0;
};

// Check if multipliers are locked (set from user preferences)
export const hasLockedMultipliers = (): boolean => {
  if (typeof document === 'undefined') return false;
  
  const style = getComputedStyle(document.documentElement);
  const colMult = style.getPropertyValue('--column-width-mult').trim();
  const textMult = style.getPropertyValue('--text-size-mult').trim();
  
  // Multipliers are locked if they exist and are not empty strings
  return colMult !== '' && textMult !== '';
};

/**
 * Column Alignment Diagnostics
 * Check if headers and row cells are properly aligned
 * Call with: window.__checkColumnAlignment__()
 */
export const checkColumnAlignment = () => {
  if (typeof document === 'undefined') {
    console.log('❌ Not in browser environment');
    return;
  }

  const headers = document.querySelectorAll('[data-column-header]');
  const firstRow = document.querySelector('[data-verse-row]');
  
  if (!headers.length) {
    console.log('❌ No column headers found');
    return;
  }
  
  if (!firstRow) {
    console.log('❌ No verse rows found');
    return;
  }

  const cells = firstRow.querySelectorAll('[data-column-cell]');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('📐 COLUMN ALIGNMENT DIAGNOSTIC');
  console.log('═══════════════════════════════════════════════════════');
  
  const style = getComputedStyle(document.documentElement);
  const mult = {
    col: style.getPropertyValue('--column-width-mult').trim() || '1',
    text: style.getPropertyValue('--text-size-mult').trim() || '1',
  };
  
  console.log('🎯 CSS Variables:');
  console.log(`  --adaptive-ref-width: ${style.getPropertyValue('--adaptive-ref-width').trim()}`);
  console.log(`  --adaptive-main-width: ${style.getPropertyValue('--adaptive-main-width').trim()}`);
  console.log(`  --adaptive-alt-width: ${style.getPropertyValue('--adaptive-alt-width').trim()}`);
  console.log(`  --adaptive-cross-width: ${style.getPropertyValue('--adaptive-cross-width').trim()}`);
  console.log(`  --adaptive-notes-width: ${style.getPropertyValue('--adaptive-notes-width').trim()}`);
  console.log(`  --column-width-mult: ${mult.col}`);
  console.log(`  --text-size-mult: ${mult.text}`);
  console.log('');
  
  console.log(`📊 Headers: ${headers.length}, Cells: ${cells.length}`);
  console.log('');
  
  let totalMismatch = 0;
  const results: any[] = [];
  
  headers.forEach((header, idx) => {
    const cell = cells[idx];
    if (!cell) {
      console.log(`⚠️  Column ${idx}: Header exists but no corresponding cell`);
      return;
    }
    
    const headerRect = header.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    
    const leftDiff = Math.abs(headerRect.left - cellRect.left);
    const widthDiff = Math.abs(headerRect.width - cellRect.width);
    
    const headerText = (header as HTMLElement).innerText?.trim() || 'Unknown';
    const cellType = cell.getAttribute('data-column-type') || 'unknown';
    
    const aligned = leftDiff < 2 && widthDiff < 2; // Allow 2px tolerance for rounding
    
    results.push({
      idx,
      name: headerText,
      type: cellType,
      headerLeft: headerRect.left.toFixed(2),
      cellLeft: cellRect.left.toFixed(2),
      leftDiff: leftDiff.toFixed(2),
      headerWidth: headerRect.width.toFixed(2),
      cellWidth: cellRect.width.toFixed(2),
      widthDiff: widthDiff.toFixed(2),
      aligned
    });
    
    if (!aligned) totalMismatch++;
  });
  
  console.table(results);
  console.log('');
  
  if (totalMismatch === 0) {
    console.log('✅ ALL COLUMNS PERFECTLY ALIGNED!');
  } else {
    console.log(`⚠️  ${totalMismatch} column(s) misaligned`);
    console.log('Note: Differences <2px are usually acceptable due to browser rounding');
  }
  
  console.log('═══════════════════════════════════════════════════════');
  
  return {
    totalColumns: headers.length,
    misalignedCount: totalMismatch,
    results,
    aligned: totalMismatch === 0
  };
};

// Expose to window for easy access
if (typeof window !== 'undefined') {
  (window as any).__checkColumnAlignment__ = checkColumnAlignment;
}
