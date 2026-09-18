import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Served from a GitHub project page, not a domain root.
  base: '/web3-login/',
  plugins: [react()],
  build: {
    // 'build' rather than Vite's default 'dist', so the Pages workflow and
    // .gitignore stay as they are — and so this never collides with the
    // dist/ path package.json advertises as the library entry point.
    outDir: 'build',
  },
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});
