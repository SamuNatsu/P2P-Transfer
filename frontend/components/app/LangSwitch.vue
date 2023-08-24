<script lang="ts" setup>
import { LocaleObject } from '@nuxtjs/i18n/dist/runtime/composables';

/* Inject */
const { locale, locales } = useI18n();
const switchLocalePath = useSwitchLocalePath();

/* Computed */
const availableLocales = computed(() => {
  return (locales.value as LocaleObject[]).filter(
    (value: { code: string }): boolean => {
      return value.code !== locale.value;
    }
  );
});
</script>

<template>
  <div class="fixed flex font-smiley items-center justify-center top-2 w-full">
    <NuxtLink
      v-for="locale in availableLocales"
      :key="locale.code"
      :to="switchLocalePath(locale.code)">
      <span class="transition-colors hover:text-blue-500">
        {{ locale.name }}
      </span>
    </NuxtLink>
  </div>
</template>
