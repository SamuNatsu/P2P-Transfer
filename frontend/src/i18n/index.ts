/// I18n module
import { Ref } from 'vue';
import { I18n, createI18n } from 'vue-i18n';
import { useLocalStorage, useNavigatorLanguage } from '@vueuse/core';

// Intergrated locales
import en from '@/i18n/locales/en.json';
import zh from '@/i18n/locales/zh.json';

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
    locale: 'zh',
    display: '简体中文'
  }
];

// Export i18n
export const i18n: I18n = createI18n({
  fallbackLocale: 'en',
  legacy: false,
  messages: { en, zh }
});

// Setup i18n
export const setupI18n = async (): Promise<void> => {
  // Get local storage locale
  let locale: string | undefined = useLocalStorage('language', undefined).value;

  // Get browser language
  const { language } = useNavigatorLanguage();

  // If undefined
  if (locale === undefined) {
    locale = language.value ?? 'en';
  }

  // Set locale
  await setLocale(locale);
};

// Set language
export const setLocale = async (locale: string): Promise<void> => {
  console.debug(`[i18n] Try set locale to "${locale}"`);

  // Match support
  const match: [string, number][] = SUPPORT_LOCALES.map(
    (v: LocaleInfo): [string, number] => {
      // Split locales
      const p1: string[] = v.locale.split('-');
      const p2: string[] = locale.split('-');

      // Count matches
      let matches: number = 0;
      for (let i = 0; i < Math.min(p1.length, p2.length); i++) {
        if (p1[i] === p2[i]) {
          matches++;
        } else {
          break;
        }
      }

      // Return match
      return [v.locale, matches];
    }
  ).sort(([l1, a], [l2, b]): number => (a !== b ? b - a : l1 < l2 ? -1 : 1));
  console.debug(
    `[i18n] Support locale matches: ${match
      .filter(([_, n]): boolean => n > 0)
      .map(([l, n]): string => `(${l},${n})`)
      .join(',')}`
  );

  // If has support
  if (match.length > 0 && match[0][1] > 0) {
    await loadMessages(match[0][0]);
  } else {
    console.debug(`[i18n] Locale "${locale}" not support`);
  }

  // Set locale
  (i18n.global.locale as Ref).value = locale;
  document.documentElement.setAttribute('lang', locale);
  console.debug(`[i18n] Locale "${locale}" set`);
};

// Load messages
const loadMessages = async (locale: string): Promise<void> => {
  console.debug(`[i18n] Try load locale "${locale}" messages`);

  // If already loaded
  if (i18n.global.availableLocales.includes(locale)) {
    console.debug(`[i18n] Locale "${locale}" messages already loaded`);
    return;
  }

  // Load messages
  const msg: any = await import(`./locales/${locale}.json`);
  i18n.global.setLocaleMessage(locale, msg);
  console.debug(`[i18n] Locale "${locale}" messages loaded`);
};
