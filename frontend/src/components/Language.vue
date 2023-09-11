<script lang="ts" setup>
import { supportLangs } from '@/i18n';

/* Injects */
const i18n = useI18n();
const storedLang = useLocalStorage('language', i18n.fallbackLocale.value as string);

/* Reactives */
const showMenu: Ref<boolean> = ref(false);

/* Functions */
async function setLanguage(locale: string): Promise<void> {
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
    storedLang.value = fallback;
  }

  showMenu.value = false;
}
</script>

<template>
  <Transition>
    <div
    v-if="showMenu"
    class="backdrop-brightness-[.2] fixed flex inset-0 items-center justify-center z-40">
      <div @click="showMenu = false" class="fixed inset-0"></div>
      <div
        class="bg-white flex flex-col font-bold font-sans gap-2 items-center p-4 rounded-lg z-50 dark:bg-neutral-900 dark:border-2 dark:border-white dark:text-white">
        <button
          v-for="i in supportLangs"
          @click="setLanguage(i.code)"
          class="transition-colors hover:text-blue-500"
          :key="i.code">
          {{ i.name }}
        </button>
      </div>
    </div>
  </Transition>
  <button @click="showMenu = true">
    <img class="h-5 w-5 transition-[filter] dark:invert" src="/imgs/language.svg"/>
  </button>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
