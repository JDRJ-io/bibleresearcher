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
          const sourcePath = path.resolve(__dirname, "client", "important docs"); // Explicit subfolder
          const destPath = path.resolve(__dirname, "dist/public/important-docs");
          try {
            await copy(sourcePath, destPath);
            console.log(`Copied important docs from ${sourcePath} to ${destPath}`);
          } catch (err) {
            console.error(`Copy failed: ${err.message}`);
            throw err; // Fail build if copy fails
          }
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, "client/index.html"),
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