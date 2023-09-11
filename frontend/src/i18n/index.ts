/// I18n module
import { I18n, createI18n } from 'vue-i18n';
import en from '@/locales/en.json';

/* Supported languages */
export const supportLangs: { code: string; name: string }[] = [
  {
    code: 'en',
    name: 'English'
  },
  {
    code: 'zh',
    name: '中文'
  }
];

/* Export i18n */
export const i18n: I18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  message: { en }
});

/* Set language */
async function setLanguage(locale: string): Promise<void> {
  const i18n = useI18n();
  const storedLang = useLocalStorage<string | undefined>('language', undefined);

  try {
    const message: any = (await import(`@/locales/${locale}.json`)).default;

    i18n.setLocaleMessage(locale, message);
    i18n.locale.value = locale;
    document.documentElement.setAttribute('lang', locale);
    storedLang.value = locale;
  } catch (err: any) {
    const fallback: string = i18n.fallbackLocale.value as string;

    i18n.locale.value = fallback;
    document.documentElement.setAttribute('lang', fallback);
    storedLang.value = locale;
  }
}

/* Detect language */
export function detectLanguage(): void {
  const i18n = useI18n();
  const storedLang = useLocalStorage<string | undefined>('language', undefined);

  if (storedLang.value !== undefined) {
    setLanguage(storedLang.value);
    return;
  }

  const langs: string[] = [];

  langs.push(window.navigator.language.split('-')[0]);
  langs.push(
    ...window.navigator.languages.map(
      (value: string): string => value.split('-')[0]
    )
  );

  const supportedLangs: string[] = supportLangs.map(
    (value: { code: string }): string => value.code
  );

  let matched: boolean = false;

  for (const i of langs) {
    if (supportedLangs.includes(i)) {
      setLanguage(i);
      matched = true;
      break;
    }
  }

  if (!matched) {
    setLanguage(i18n.fallbackLocale.value as string);
  }
}
