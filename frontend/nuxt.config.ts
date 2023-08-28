/// Nuxt config
import pkg from './package.json';

/* Export config */
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/i18n', '@nuxtjs/tailwindcss', 'nuxt-svgo'],
  i18n: {
    defaultLocale: 'en',
    detectBrowserLanguage: false,
    lazy: true,
    langDir: './i18n',
    locales: [
      {
        code: 'en',
        file: './en.json',
        iso: 'en-US',
        name: 'English'
      },
      {
        code: 'zh',
        file: './zh.json',
        iso: 'zh-CN',
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
  svgo: {
    defaultImport: 'component'
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
