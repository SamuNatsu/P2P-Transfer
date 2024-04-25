<script lang="ts" setup>
import { Ref, watch } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { SUPPORT_LOCALES, setLocale } from '@/i18n';

// Components
import MdiLanguage from '~icons/mdi/language';

// Injects
const language: Ref<string> = useLocalStorage('language', '');

// Watches
watch(language, (): void => {
  setLocale(language.value);
});
</script>

<template>
  <div
    class="bg-neutral-700 flex gap-2 items-center mt-4 px-2 py-1 rounded hover:bg-neutral-600">
    <MdiLanguage class="text-2xl" />
    <select
      v-model="language"
      class="bg-transparent cursor-pointer outline-none">
      <option
        v-for="{ locale, display } in SUPPORT_LOCALES"
        class="text-black"
        :value="locale">
        {{ display }}
      </option>
    </select>
  </div>
</template>
