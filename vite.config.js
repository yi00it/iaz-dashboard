import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'IAZDashboard',
      formats: ['es', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'iaz-dashboard.esm.js';
        if (format === 'umd') return 'iaz-dashboard.umd.js';
        return `iaz-dashboard.${format}.js`;
      },
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'iaz-dashboard.css';
          }
          return assetInfo.name;
        },
      },
    },
    sourcemap: true,
  },
});
