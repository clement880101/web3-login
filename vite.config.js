import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { buildSitemap, lastModified, siteUrl } from './scripts/sitemap.js';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

/** Emits sitemap.xml next to the built page. robots.txt points at it. */
function sitemap() {
  return {
    name: 'emit-sitemap',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: buildSitemap({
          url: siteUrl(pkg.homepage),
          lastmod: lastModified(),
        }),
      });
    },
  };
}

export default defineConfig({
  // Served from a GitHub project page, not a domain root.
  base: '/web3-login/',
  plugins: [react(), sitemap()],
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
