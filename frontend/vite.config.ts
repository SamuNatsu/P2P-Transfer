/// Vite config
import { defineConfig } from 'vite';
import { resolve } from 'path';

// Plugins
import icons from 'unplugin-icons/vite';
import svgLoader from 'vite-svg-loader';
import vue from '@vitejs/plugin-vue';

// Export config
export default defineConfig({
  define: {
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_JIT_COMPILATION__: true
  },
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
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  }
});
