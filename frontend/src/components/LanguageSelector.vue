<script lang="ts" setup>
import { Ref, watch } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { SUPPORT_LOCALES, setLocale } from '@/i18n';

// Components
import { Icon } from '@iconify/vue';

// Injects
const language: Ref<string> = useLocalStorage('language', '');

// Watches
watch(language, (): void => {
  setLocale(language.value);
});
</script>

<template>
  <div class="bg-neutral-700 flex gap-2 items-center mt-8 px-2 py-1 rounded">
    <Icon class="text-2xl" icon="mdi:language" />
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
