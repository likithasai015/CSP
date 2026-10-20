import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  // Base path strategy:
  // - On Vercel (VERCEL=1), standard production root, or local development, base is '/'
  // - Only when explicitly building for GitHub Pages via GITHUB_ACTIONS without Vercel, fallback to '/CSP/'
  // - Allow manual override via VITE_BASE_PATH
  const isGitHubPages = Boolean(process.env.GITHUB_ACTIONS && !process.env.VERCEL);
  const base = process.env.VITE_BASE_PATH || (isGitHubPages ? '/CSP/' : '/');

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    css: {
      postcss: {},
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
