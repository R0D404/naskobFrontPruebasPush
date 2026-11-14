import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'maps/*'],
      manifest: {
        name: 'NasKob · Rotación Resiliente',
        short_name: 'NasKob',
        description: 'Apoyo a la decisión de rotación de cultivos para pequeños productores en Chiapas con datos de la NASA',
        theme_color: '#14302b',
        background_color: '#f3f6f4',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,pmtiles}'],
        maximumFileSizeToCacheInBytes: 60 * 1024 * 1024 // 60 MB para admitir frailesca.pmtiles y chiapas.pmtiles
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
