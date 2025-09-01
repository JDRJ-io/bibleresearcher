import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { copy } from "fs-extra";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
        ? [(async () => (await import("@replit/vite-plugin-cartographer")).cartographer())()]
        : []),
      {
        name: 'copy-important-docs',
        apply: 'build',
        writeBundle: async () => {
          await copy(
            path.resolve(import.meta.dirname, "client/important docs"),
            path.resolve(import.meta.dirname, "dist/public/important-docs")
          );
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(import.meta.dirname, "client/index.html"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: parseInt(process.env.PORT || "5000"),
      allowedHosts: process.env.REPL_ID ? [".replit.dev"] : true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
    define: {
      'import.meta.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
      'import.meta.env.SUPABASE_BUCKET': JSON.stringify(env.SUPABASE_BUCKET),
    },
  };
});