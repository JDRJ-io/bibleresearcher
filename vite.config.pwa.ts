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
      workbox: {
        cleanupOutdatedCaches: true,
        // Force Service Worker update by bumping revision
        manifestTransforms: [(manifestEntries) => {
          manifestEntries.push({ url: '/sw-version', revision: '2025-09-25-v3', size: 0 });
          return { manifest: manifestEntries };
        }],
        runtimeCaching: [
          {
            // Match both /sign/ and /public/ Supabase URLs for translations
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.supabase.co') &&
              url.pathname.startsWith('/storage/v1/object/') &&
              /\/translations\/[^/]+\.txt$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'translations-cache-v3',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 14 // 14 days
              }
            }
          },
          {
            // Match both /sign/ and /public/ Supabase URLs for prophecy files
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.supabase.co') &&
              url.pathname.startsWith('/storage/v1/object/') &&
              /\/references\/prophecy_(rows\.json|index\.txt)$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'prophecy-cache',
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
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
        enabled: true // Enable in dev to test Service Worker caching
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