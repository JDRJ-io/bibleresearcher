import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Service Worker registration will be handled by vite-plugin-pwa
// The plugin auto-adds this code to main.tsx at build time

createRoot(document.getElementById("root")!).render(<App />);
