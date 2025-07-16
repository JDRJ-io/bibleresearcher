# PWA Implementation Details  (2025‑07)

This file documents how the Anointed.io Bible reader is converted into an installable,
offline‑capable Progressive Web App using **Vite**, **vite‑plugin‑pwa**, and Workbox.

## 1  vite‑plugin‑pwa config (`vite.config.pwa.ts`)

```ts
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.svg', 'audio/*'],
  manifest: {
    name: 'Anointed Bible Study',
    short_name: 'Anointed',
    display: 'standalone',
    theme_color: '#0d9488',
    icons: [
      { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /\/storage\/v1\/object\/public\/anointed\/.+/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'bible-files',
          expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
    ],
    globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
  },
});
