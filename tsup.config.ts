import { defineConfig } from 'tsup';

export default defineConfig([
  // Main entry (vanilla JS)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: true,
    external: ['react', 'react-dom'],
  },
  // React entry
  {
    entry: ['src/react/index.ts'],
    outDir: 'dist/react',
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    treeshake: true,
    minify: true,
    external: ['react', 'react-dom'],
    esbuildOptions(options) {
      options.banner = {
        js: '"use client";',
      };
    },
  },
  // Server entry (Node.js/Edge)
  {
    entry: ['src/server.ts'],
    outDir: 'dist/server',
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    treeshake: true,
    minify: true,
  },
]);
