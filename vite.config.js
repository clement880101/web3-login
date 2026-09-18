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
    coverage: {
      provider: 'v8',
      // Only the published library is held to a threshold; the demo page is
      // exercised by hand and by the Pages build.
      include: ['src/lib/**/*.{js,jsx}'],
      exclude: ['src/lib/__tests__/**', 'src/lib/testUtils/**'],
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 85,
        branches: 70,
        statements: 80,
      },
    },
  },
});
