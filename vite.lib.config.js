import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Library build. Separate from vite.config.js, which builds the demo site.
 *
 * React, MUI and Emotion are peer dependencies and must stay external: bundling
 * them would give a consumer a second copy of React (breaking hooks) and a
 * second Emotion cache (breaking theming).
 */
export default defineConfig({
  plugins: [react()],
  // Without this Vite copies public/ (favicon, manifest, robots.txt) into the
  // package tarball.
  publicDir: false,
  build: {
    outDir: 'dist',
    sourcemap: true,
    lib: {
      entry: 'src/lib/index.js',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        /^react\//,
        /^react-dom\//,
        /^@mui\//,
        /^@emotion\//,
      ],
    },
  },
});
