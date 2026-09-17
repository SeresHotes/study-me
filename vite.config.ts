import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Base-путь для GitHub Pages project-site: https://<user>.github.io/study-me/
// При деплое на корень (кастомный домен или user-site) поменяй на '/'.
const base = '/study-me/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'StudyMe — трекер личных исследований',
        short_name: 'StudyMe',
        description:
          'Запускай исследования над собой на срок, описывай показатели и отмечайся периодически.',
        theme_color: '#6c5ce7',
        background_color: '#0f1117',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ru',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});
