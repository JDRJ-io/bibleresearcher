/**
 * Shared text measurement utility - replaces per-row ghost elements
 * 
 * PERF FIX: Instead of creating 120 ghost DOM elements (one per row),
 * we create a single reusable measurement element.
 * 
 * - Before: 120 rows × create/append/measure/remove = 480 DOM ops per scroll
 * - After: 1 shared element, reused for all measurements
 */

let measurementSpan: HTMLSpanElement | null = null;

function getMeasurementElement(): HTMLSpanElement {
  if (!measurementSpan) {
    measurementSpan = document.createElement('span');
    measurementSpan.style.whiteSpace = 'nowrap';
    measurementSpan.style.position = 'absolute';
    measurementSpan.style.visibility = 'hidden';
    measurementSpan.style.writingMode = 'initial';
    measurementSpan.style.transform = 'none';
    measurementSpan.style.top = '0';
    measurementSpan.style.left = '0';
    measurementSpan.style.pointerEvents = 'none';
    document.body.appendChild(measurementSpan);
  }
  return measurementSpan;
}

interface TextMeasurementOptions {
  text: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  letterSpacing?: string;
  textTransform?: string;
  fontVariant?: string;
  wordSpacing?: string;
  lineHeight?: string;
}

/**
 * Measure the natural width of text with given font properties
 * Uses a shared DOM element to avoid creating/destroying elements
 */
export function measureTextWidth(options: TextMeasurementOptions): number {
  const span = getMeasurementElement();
  
  // Update text content
  span.textContent = options.text;
  
  // Apply font styles
  span.style.fontFamily = options.fontFamily;
  span.style.fontSize = options.fontSize;
  span.style.fontWeight = options.fontWeight;
  
  if (options.letterSpacing) span.style.letterSpacing = options.letterSpacing;
  if (options.textTransform) span.style.textTransform = options.textTransform;
  if (options.fontVariant) span.style.fontVariant = options.fontVariant;
  if (options.wordSpacing) span.style.wordSpacing = options.wordSpacing;
  if (options.lineHeight) span.style.lineHeight = options.lineHeight;
  
  // Measure
  const width = span.getBoundingClientRect().width;
  
  return width;
}

/**
 * Cleanup function - call when unmounting the app or no longer needed
 */
export function cleanupMeasurementElement() {
  if (measurementSpan && measurementSpan.parentNode) {
    measurementSpan.parentNode.removeChild(measurementSpan);
    measurementSpan = null;
  }
}
