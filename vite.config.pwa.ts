import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    VitePWA({
      registerType: 'autoUpdate',
      srcDir: 'client/src',
      filename: 'sw.ts',
      workbox: {
        globDirectory: 'dist/',
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2,woff}'
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/translations\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'translations-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Anointed Bible Study',
        short_name: 'Anointed',
        description: 'Complete Bible study platform with offline capabilities',
        theme_color: '#1a202c',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'icon-512.svg', 
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      devOptions: {
        enabled: false // Disable in dev to avoid conflicts
      }
    }),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@lib": path.resolve(__dirname, "./client/src/lib"),
      "@components": path.resolve(__dirname, "./client/src/components"),
      "@pages": path.resolve(__dirname, "./client/src/pages"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});