/**
 * Privacy-first analytics using Plausible
 * Only loads after user consent
 * 
 * Ad pixels (Meta/TikTok) are disabled by default.
 * Enable them only when running paid campaigns.
 */

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, string | number | boolean>; u?: string }) => void;
    fbq?: (...args: any[]) => void;
    ttq?: { track: (event: string, data?: any) => void };
  }
}

const ENABLE_AD_PIXELS = false;

let analyticsEnabled = false;
let plausibleLoaded = false;

interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

function captureUTMParams(): UTMParams {
  const params = new URLSearchParams(window.location.search);
  const utm: UTMParams = {};
  
  ['source', 'medium', 'campaign', 'term', 'content'].forEach(key => {
    const value = params.get(`utm_${key}`);
    if (value) {
      utm[`utm_${key}` as keyof UTMParams] = value;
    }
  });
  
  if (Object.keys(utm).length > 0) {
    try {
      localStorage.setItem('anointed_utm', JSON.stringify(utm));
      console.log('[Analytics] Captured UTM params:', utm);
    } catch (e) {
      console.warn('[Analytics] Failed to save UTM params');
    }
  }
  
  return utm;
}

function getStoredUTMParams(): UTMParams {
  try {
    const stored = localStorage.getItem('anointed_utm');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Load Plausible analytics script (only after user consent)
 */
export function enableAnalytics(domain: string = 'anointed.io'): void {
  if (plausibleLoaded) {
    console.log('[Analytics] Plausible already loaded');
    return;
  }

  captureUTMParams();

  const script = document.createElement('script');
  script.defer = true;
  script.setAttribute('data-domain', domain);
  script.src = 'https://plausible.io/js/script.js';
  
  script.onload = () => {
    plausibleLoaded = true;
    analyticsEnabled = true;
    console.log('[Analytics] Plausible loaded successfully');
    
    trackPageview();
    
    if (ENABLE_AD_PIXELS) {
      enableAdPixels();
    }
  };

  script.onerror = () => {
    console.error('[Analytics] Failed to load Plausible');
  };

  document.head.appendChild(script);
}

/**
 * Load ad pixels (Meta, TikTok) - Only enable when running paid campaigns
 * Set ENABLE_AD_PIXELS = true above to activate
 */
function enableAdPixels(): void {
  console.log('[Analytics] Ad pixels disabled. Enable by setting ENABLE_AD_PIXELS = true');
}

/**
 * Track a pageview (for SPA navigation)
 */
export function trackPageview(url?: string): void {
  if (!analyticsEnabled || !window.plausible) return;
  
  const pageUrl = url || window.location.href;
  window.plausible('pageview', { u: pageUrl });
}

/**
 * Track custom events
 */
export function trackEvent(
  eventName: string, 
  props?: Record<string, string | number | boolean>
): void {
  if (!analyticsEnabled || !window.plausible) return;
  
  window.plausible(eventName, { props });
}

// Event tracking helpers for common actions
export const Analytics = {
  // Donation events (with UTM attribution)
  donationStart: (amount?: number) => {
    const utm = getStoredUTMParams();
    trackEvent('donation_start', { ...utm, ...(amount ? { amount } : {}) });
  },
  donationCheckout: (amount: number) => {
    const utm = getStoredUTMParams();
    trackEvent('donation_checkout', { amount, ...utm });
  },
  donationSuccess: (amount: number, currency: string = 'USD') => {
    const utm = getStoredUTMParams();
    trackEvent('donation_success', { amount, currency, ...utm });
    
    if (ENABLE_AD_PIXELS) {
      window.fbq?.('track', 'Purchase', { value: amount, currency });
      window.ttq?.track('CompletePayment', { value: amount, currency });
    }
  },
  
  // Auth events
  signupStart: () => trackEvent('signup_start'),
  loginSuccess: () => trackEvent('login_success'),
  
  // User actions
  shareClick: (content: string) => trackEvent('share_click', { content }),
  bookmarkCreate: (verse?: string) => trackEvent('bookmark_create', verse ? { verse } : undefined),
  
  // UI interactions
  translationToggle: (translation: string) => trackEvent('translation_toggle', { translation }),
  prophecyToggle: (state: 'on' | 'off') => trackEvent('prophecy_toggle', { state }),
  verseCopy: (verse: string) => trackEvent('verse_copy', { verse }),
  
  // Search & navigation
  searchPerformed: (query: string) => trackEvent('search_performed', { query }),
  bookNavigate: (book: string) => trackEvent('book_navigate', { book }),
  
  // Error tracking
  errorBoundaryTriggered: (component: string) => trackEvent('error_boundary_triggered', { component }),
  
  // Feature usage
  strongsLookup: (strongsId: string) => trackEvent('strongs_lookup', { strongsId }),
  crossRefClick: (verse: string) => trackEvent('crossref_click', { verse }),
  notesCreate: () => trackEvent('notes_create'),
  highlightCreate: () => trackEvent('highlight_create'),
};

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  return analyticsEnabled;
}

/**
 * Disable analytics (for testing or user opt-out)
 */
export function disableAnalytics(): void {
  analyticsEnabled = false;
  console.log('[Analytics] Analytics disabled');
}
