<script lang="ts" setup>
import { onBeforeMount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { setupI18n } from '@/i18n';
import { useTitle } from '@vueuse/core';

// Components
import AppHeader from '@/components/AppHeader.vue';

// Injects
const title = useTitle();
const { locale, t } = useI18n();

// Watches
watch(locale, (): void => {
  title.value = t('title');
});

// Hooks
onBeforeMount(async (): Promise<void> => {
  // Setup i18n
  await setupI18n();

  // Set title
  title.value = t('title');
});
</script>

<template>
  <AppHeader />
</template>
