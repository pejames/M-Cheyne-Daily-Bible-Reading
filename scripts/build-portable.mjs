import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {build} from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.resolve(rootDir, 'public/portable');

async function buildPortable() {
  fs.mkdirSync(outDir, {recursive: true});

  await build({
    root: rootDir,
    configFile: false,
    publicDir: false,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    build: {
      outDir,
      emptyOutDir: true,
      cssCodeSplit: false,
      sourcemap: false,
      minify: 'esbuild',
      lib: {
        entry: path.resolve(rootDir, 'src/portableEntry.tsx'),
        name: 'DailyBreadPortable',
        formats: ['iife'],
        fileName: () => 'portable-app.iife.js',
      },
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'portable-app.css';
            }
            return '[name][extname]';
          },
        },
      },
    },
  });
}

buildPortable().catch((err) => {
  console.error('Failed to build portable bundle:', err);
  process.exit(1);
});
