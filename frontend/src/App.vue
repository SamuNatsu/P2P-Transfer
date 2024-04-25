<script lang="ts" setup>
import { onBeforeMount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { setupI18n } from '@/i18n';
import { useTitle } from '@vueuse/core';

// Components
import { RouterView } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import AppFooter from '@/components/AppFooter.vue';

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
  <LanguageSelector />
  <RouterView v-slot="{ Component }">
    <Transition>
      <KeepAlive>
        <component :is="Component" />
      </KeepAlive>
    </Transition>
  </RouterView>
  <AppFooter />
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.25s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
