/// Vite config
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import autoImport from 'unplugin-auto-import/vite';
import viteComponents from 'unplugin-vue-components/vite';
import { VantResolver } from 'unplugin-vue-components/resolvers';

/* https://vitejs.dev/config/ */
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  },
  plugins: [
    autoImport({
      dirs: ['./src/i18n', './src/utils'],
      dts: true,
      imports: ['@vueuse/core', 'vue', 'vue-i18n'],
      include: [/\.[tj]sx?$/, /\.vue$/]
    }),
    viteComponents({
      dts: true,
      resolvers: [VantResolver()]
    }),
    vue()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/socket.io': {
        changeOrigin: true,
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  }
});
