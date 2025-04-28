import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

// Rspack plugins
import icons from 'unplugin-icons/rspack';

// Export config
export default defineConfig({
  html: {
    favicon: './src-frontend/assets/logo.svg',
    title: 'P2P Transfer',
  },
  plugins: [pluginVue()],
  server: {
    proxy: {
      '/socket.io': {
        changeOrigin: true,
        target: 'http://localhost:8080',
        ws: true,
      },
    },
  },
  source: {
    assetsInclude: /\.txt$/,
    entry: { index: './src-frontend' },
  },
  tools: {
    rspack: {
      plugins: [icons({ autoInstall: true })],
    },
  },
});
