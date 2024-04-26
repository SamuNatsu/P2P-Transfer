/// Rollup config
import { defineConfig } from 'rollup';

// Plugins
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

// Export config
export default defineConfig({
  input: './src/main.ts',
  output: [
    {
      file: './dist/server.esm.min.js',
      format: 'esm',
      plugins: [terser()]
    },
    {
      file: './dist/server.esm.js',
      format: 'esm'
    }
  ],
  plugins: [typescript()]
});
