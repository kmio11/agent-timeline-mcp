import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    fs: {
      allow: ['..', '/home/user/work/agent-timeline-mcp/.git/.wt/feature-ui-enhancement'],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
