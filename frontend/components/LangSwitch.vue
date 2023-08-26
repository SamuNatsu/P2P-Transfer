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
  <div class="flex font-smiley items-center justify-center">
    <NuxtLink
      v-for="i in availableLocales"
      class="transition-colors hover:text-blue-500"
      :to="switchLocalePath(i.code)">
      {{ i.name }}
    </NuxtLink>
  </div>
</template>
