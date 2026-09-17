import { execFileSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Base-путь для GitHub Pages project-site: https://<user>.github.io/study-me/
// При деплое на корень (кастомный домен или user-site) поменяй на '/'.
const base = '/study-me/';

// Версия генерируется из git во время сборки — вручную её править не нужно,
// поэтому и конфликтов из-за поля "version" больше не бывает.
// Формат: «2026-09-18 14:30 · a1b2c3d» (дата и время коммита + короткий хеш).
function resolveVersion(): string {
  try {
    const git = (args: string[]) => execFileSync('git', args).toString().trim();
    const hash = git(['rev-parse', '--short', 'HEAD']);
    const date = git(['show', '-s', '--format=%cd', '--date=format:%Y-%m-%d %H:%M', 'HEAD']);
    return `${date} · ${hash}`;
  } catch {
    // git недоступен (например, сборка из архива без .git) — не роняем билд.
    return 'dev';
  }
}

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(resolveVersion()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'icon.svg',
        'icon-maskable.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-192.png',
        'icon-maskable-512.png',
      ],
      manifest: {
        name: 'StudyMe — трекер личных исследований',
        short_name: 'StudyMe',
        description:
          'Запускай исследования над собой на срок, описывай показатели и отмечайся периодически.',
        theme_color: '#f8f5ef',
        background_color: '#f8f5ef',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ru',
        start_url: base,
        scope: base,
        icons: [
          // Растровые PNG нужны Android Chrome для кнопки «Установить» и качественной
          // иконки на рабочем столе; SVG оставляем как масштабируемый вариант.
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
