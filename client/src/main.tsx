import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize global logging system
import { initializeInstrumentation } from "@/lib/instrumentedAPI";
import { globalLogger } from "@/lib/globalLogger";
import { systemDocumenter } from "@/lib/systemDocumenter";

// STEP 1: Initialize comprehensive logging system
initializeInstrumentation();

// STEP 1b: Start automatic system documentation
systemDocumenter.start();

// STEP 2: Global fetch-guard for dev mode - prevents stray /api/references calls  
if (import.meta.env.DEV) {
  // Note: fetch is already instrumented by instrumentedAPI.ts
  const instrumentedFetch = window.fetch;
  window.fetch = (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    if (url && url.includes('/api/references/')) {
      globalLogger.logError('stray fetch to /api route: ' + url, 'fetch-guard');
      console.error('🚨 stray fetch to /api route:', url);
      throw new Error('stray /api reference fetch');
    }
    return instrumentedFetch(...args);
  };
}

// Service Worker registration will be handled by vite-plugin-pwa
// The plugin auto-adds this code to main.tsx at build time

// Dev guard: SW disabled in dev - enable by setting VITE_PWA_DEV=true
if (import.meta.env.DEV && !import.meta.env.VITE_PWA_DEV && 'serviceWorker' in navigator) {
  console.log('SW disabled in dev - enable by setting VITE_PWA_DEV=true');
}

createRoot(document.getElementById("root")!).render(<App />);
