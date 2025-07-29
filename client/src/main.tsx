import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Service Worker registration will be handled by vite-plugin-pwa
// The plugin auto-adds this code to main.tsx at build time

// Dev guard: SW disabled in dev - enable by setting VITE_PWA_DEV=true
if (import.meta.env.DEV && !import.meta.env.VITE_PWA_DEV && 'serviceWorker' in navigator) {
  console.log('SW disabled in dev - enable by setting VITE_PWA_DEV=true');
}

createRoot(document.getElementById("root")!).render(<App />);
