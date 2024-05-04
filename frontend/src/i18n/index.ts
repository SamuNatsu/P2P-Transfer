/// I18n module
import { Ref } from 'vue';
import { I18n, createI18n } from 'vue-i18n';
import {
  createGlobalState,
  useLocalStorage,
  useNavigatorLanguage
} from '@vueuse/core';

// Intergrated locales
import en from '@/i18n/en.json';
import zh from '@/i18n/zh.json';

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
  },
  {
    locale: 'ja',
    display: '日本語'
  }
];

// Export i18n
export const i18n: I18n = createI18n({
  fallbackLocale: 'en',
  legacy: false,
  messages: { en, zh }
});

// Export local locale
export const useLocale = createGlobalState(() =>
  useLocalStorage<string | undefined>('language', undefined)
);

// Setup i18n
export const setupI18n = async (): Promise<void> => {
  // Get local storage locale
  const locale: Ref<string | undefined> = useLocale();

  // Get browser language
  const { language } = useNavigatorLanguage();

  // If undefined
  if (locale.value === undefined) {
    locale.value = language.value ?? 'en';
  }

  // Set locale
  await setLocale(locale.value);
};

// Set language
export const setLocale = async (locale: string): Promise<void> => {
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

  // If has support
  if (match.length > 0 && match[0][1] > 0) {
    // Load messages
    await loadMessages(match[0][0]);

    // Set locale
    useLocale().value = match[0][0];
    (i18n.global.locale as Ref<string>).value = match[0][0];
    document.documentElement.setAttribute('lang', match[0][0]);
  } else {
    // Set locale
    useLocale().value = 'en';
    (i18n.global.locale as Ref<string>).value = 'en';
    document.documentElement.setAttribute('lang', 'en');
  }
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
