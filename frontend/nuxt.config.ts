/// Nuxt config
import pkg from './package.json';

/* Export config */
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/i18n', '@nuxtjs/tailwindcss'],
  i18n: {
    defaultLocale: 'en',
    detectBrowserLanguage: {},
    lazy: true,
    langDir: './i18n',
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        file: './en.json',
        name: 'English'
      },
      {
        code: 'zh',
        iso: 'zh-CN',
        file: './zh.json',
        name: '中文'
      }
    ],
    skipSettingLocaleOnNavigate: true,
    strategy: 'prefix_except_default'
  },
  pages: true,
  plugins: ['~/plugins/vue3-notification.client.ts'],
  runtimeConfig: {
    public: {
      version: pkg.version
    }
  },
  vite: {
    server: {
      proxy: {
        '/socket.io': {
          target: 'ws://localhost:3001',
          ws: true
        }
      }
    }
  }
});
