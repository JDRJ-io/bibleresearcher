// EAGER import so the dev hook runs and attaches window.__sb
import './lib/supabaseClient';

import * as Sentry from "@sentry/browser";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/column-headers-scrollbar-fix.css";
import { logger } from "@/lib/logger";

// Initialize Sentry for frontend error monitoring (production-ready)
// Only initialize in production to avoid dev noise from adblock/CSP
const ENABLE_VENDOR_SDKS = import.meta.env.PROD && !/localhost|dev/.test(window.location.host);

if (ENABLE_VENDOR_SDKS && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance monitoring sample rate
    tracesSampleRate: 0.1,
    // Session replay sample rates
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  });
}

(function ensureFxLayer() {
  const createFxLayer = () => {
    if (!document.getElementById('theme-fx')) {
      const fx = document.createElement('div');
      fx.id = 'theme-fx';
      fx.setAttribute('aria-hidden', 'true');
      document.body.prepend(fx);
      console.log('✨ Created #theme-fx layer');
    }
    
    if (!document.getElementById('theme-fx-vignette')) {
      const vignette = document.createElement('div');
      vignette.id = 'theme-fx-vignette';
      vignette.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(vignette, document.body.children[1] || null);
      console.log('✨ Created #theme-fx-vignette layer');
    }
  };
  
  // Create initially
  createFxLayer();
  
  // Watch for removal (hot-reload, route transitions, etc.) and auto-recreate
  const observer = new MutationObserver(() => {
    createFxLayer();
  });
  
  observer.observe(document.body, { childList: true });
})();

// Handle unhandled promise rejections gracefully to prevent Vite error overlay
window.addEventListener('unhandledrejection', (event) => {
  // Suppress unhandled rejections to prevent development error overlay
  event.preventDefault();
});

// Also handle general error events that might trigger Vite overlay
window.addEventListener('error', (event) => {
  // Prevent Vite error overlay for all errors
  event.preventDefault();
});

// Override console.error to prevent Vite runtime error overlay
const originalConsoleError = console.error;
console.error = (...args) => {
  // Check if this is a fetch error or Strong's related error
  const message = args.join(' ');
  if (message.includes('Failed to fetch') || 
      message.includes('strong') || 
      message.includes('fetch') ||
      message.includes('plugin:runtime-error-plugin')) {
    // Suppress these errors completely
    return;
  }
  // Allow other errors through
  originalConsoleError.apply(console, args);
};

// =============================================================================
// A) FLAGS AND DATA FLOW STATUS
// =============================================================================

// Log environment flags at app startup
logger.debug('HIGHLIGHTS', 'env-flags', {
  VITE_HIGHLIGHTS_V2_ENABLED: import.meta.env.VITE_HIGHLIGHTS_V2_ENABLED,
  VITE_HL_V1_DISABLED: import.meta.env.VITE_HL_V1_DISABLED,
  VITE_HL_V2_HARD_FAIL: import.meta.env.VITE_HL_V2_HARD_FAIL,
  v2_enabled: import.meta.env.VITE_HIGHLIGHTS_V2_ENABLED === 'true',
  v1_disabled: import.meta.env.VITE_HL_V1_DISABLED === 'true',
  hard_fail: import.meta.env.VITE_HL_V2_HARD_FAIL === 'true'
});

// Service Worker registration will be handled by vite-plugin-pwa
// The plugin auto-adds this code to main.tsx at build time

// Dev guard: SW disabled in dev - enable by setting VITE_PWA_DEV=true
if (import.meta.env.DEV && !import.meta.env.VITE_PWA_DEV && 'serviceWorker' in navigator) {
  console.log('SW disabled in dev - enable by setting VITE_PWA_DEV=true');
}

createRoot(document.getElementById("root")!).render(<App />);
