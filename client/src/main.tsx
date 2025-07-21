import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// STEP 2: Global fetch-guard for dev mode - prevents stray /api/references calls
if (import.meta.env.DEV) {
  const originalFetch = window.fetch;
  window.fetch = (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    if (url && url.includes('/api/references/')) {
      console.error('🚨 stray fetch to /api route:', url);
      throw new Error('stray /api reference fetch');
    }
    return originalFetch(...args);
  };
}

// Service Worker registration will be handled by vite-plugin-pwa
// The plugin auto-adds this code to main.tsx at build time

// Dev guard: SW disabled in dev - enable by setting VITE_PWA_DEV=true
if (import.meta.env.DEV && !import.meta.env.VITE_PWA_DEV && 'serviceWorker' in navigator) {
  console.log('SW disabled in dev - enable by setting VITE_PWA_DEV=true');
}

createRoot(document.getElementById("root")!).render(<App />);
