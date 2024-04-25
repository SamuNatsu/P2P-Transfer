/// Vite config
import { defineConfig } from 'vite';
import { resolve } from 'path';

// Plugins
import icons from 'unplugin-icons/vite';
import svgLoader from 'vite-svg-loader';
import vue from '@vitejs/plugin-vue';

// Export config
export default defineConfig({
  plugins: [icons({ autoInstall: true }), svgLoader(), vue()],
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
