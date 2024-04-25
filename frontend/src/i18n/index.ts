/// I18n module
import { I18n, createI18n } from 'vue-i18n';
import { useLocalStorage, useNavigatorLanguage } from '@vueuse/core';

// Intergrated locales
import en from '@/i18n/locales/en.json';
import { Ref } from 'vue';

// Types
export type LocaleInfo = {
  locale: string;
  display: string;
};

// Support locales
export const SUPPORT_LOCALES: LocaleInfo[] = [
  {
    locale: 'en',
    display: 'English'
  },
  {
    locale: 'zh-CN',
    display: '简体中文'
  }
];

// Export i18n
export const i18n: I18n = createI18n({
  fallbackLocale: 'en',
  legacy: false,
  messages: { en }
});

// Setup i18n
export const setupI18n = (): void => {
  // Get local storage locale
  let locale: string | undefined = useLocalStorage('language', undefined).value;

  // Get browser language
  const { language } = useNavigatorLanguage();

  // If undefined
  if (locale === undefined) {
    locale = language.value ?? 'en';
  }

  // Set locale
  setLocale(locale);
};

// Set language
export const setLocale = (locale: string): void => {
  // Set locale
  (i18n.global.locale as Ref).value = locale;
  document.documentElement.setAttribute('lang', locale);

  // Check support
  if (
    SUPPORT_LOCALES.find(
      (v: LocaleInfo): boolean =>
        v.locale === locale || v.locale.split('-')[0] === locale
    ) === undefined
  ) {
    return;
  }

  // Load messages
  loadMessages(locale);
};

// Load messages
const loadMessages = async (locale: string): Promise<void> => {
  // If already loaded
  if (i18n.global.availableLocales.includes(locale)) {
    return;
  }

  // Load messages
  const msg: any = await import(`./locales/${locale}.json`);
  i18n.global.setLocaleMessage(locale, msg);
};
