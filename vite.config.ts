import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import dts from 'vite-plugin-dts';

export default defineConfig(({ command, mode }) => {
  // Configuration for building the library to publish on NPM
  if (mode === 'lib') {
    return {
      build: {
        copyPublicDir: false,
        lib: {
          entry: fileURLToPath(new URL('./src/lib/index.ts', import.meta.url)),
          name: 'PhysicsBanner',
          fileName: 'physics-banner',
        },
        outDir: 'dist',
        rollupOptions: {
          external: [],
          output: { globals: {} },
        },
      },
      plugins: [dts({ include: ['src/lib'] })],
    };
  }

  // Configuration for building the GitHub Pages Demo Site
  return {
    base: '/Physics-Banner/',
    build: {
      outDir: 'dist-demo',
    },
  };
});