// rollup.config.js
import { defineConfig } from 'rollup';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default defineConfig({
  input: 'src/main.ts',
  output: {
    file: 'dist/server.min.mjs',
    format: 'esm'
  },
  external: ['express', 'socket.io', 'http', 'https', 'dotenv', 'fs', 'nanoid'],
  plugins: [terser(), typescript()]
});
