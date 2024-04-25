/// Vite config
import { defineConfig } from 'vite';
import { resolve } from 'path';

// Plugins
import vue from '@vitejs/plugin-vue';

// Export config
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve('./src')
    }
  },
  server: {
    proxy: {
      '/ws': {
        changeOrigin: true,
        target: 'http://localhost:3000/ws',
        ws: true
      }
    }
  }
});
