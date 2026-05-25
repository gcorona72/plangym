import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

/**
 * BASE_PATH se setea en CI:
 *  - GitHub Pages → "/plangym/" (la app vive bajo gcorona72.github.io/plangym/)
 *  - Cloudflare Pages / Netlify / dev → "/" (subdominio propio)
 */
const BASE = process.env.BASE_PATH || '/';

export default defineConfig({
  base: BASE,
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, './src/lib'),
      $stores: path.resolve(__dirname, './src/stores'),
      $db: path.resolve(__dirname, './src/db'),
      $components: path.resolve(__dirname, './src/components'),
      $utils: path.resolve(__dirname, './src/utils')
    }
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'PlanGym · Entrenamiento y Nutrición',
        short_name: 'PlanGym',
        description: 'Tu plan personal de entrenamiento, nutrición y sueño para ectomorfo en volumen.',
        theme_color: '#3b82f6',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        scope: BASE,
        start_url: BASE,
        lang: 'es',
        categories: ['fitness', 'health', 'lifestyle'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: true, // expone en LAN para probar desde el móvil
    port: 5173
  }
});
