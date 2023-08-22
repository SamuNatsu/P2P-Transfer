// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/i18n', '@nuxtjs/tailwindcss'],
  i18n: {
    defaultLocale: 'en',
    detectBrowserLanguage: {},
    lazy: true,
    langDir: './i18n',
    locales: [
      { code: 'en', iso: 'en-US', file: './en.json' },
      { code: 'zh', iso: 'zh-CN', file: './zh.json' }
    ],
    strategy: 'prefix_except_default'
  },
  pages: true,
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
