<script lang="ts" setup>
import { onBeforeMount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { setupI18n } from '@/i18n';
import { useTitle } from '@vueuse/core';

// Stores
import { useStore } from '@/stores';

// Components
import AppHeader from '@/components/app/AppHeader.vue';
import AppFooter from '@/components/app/AppFooter.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';
import { RouterView } from 'vue-router';

// Injects
const title = useTitle();
const { locale, t } = useI18n();
const { init } = useStore();

// Watches
watch(locale, (): void => {
  title.value = t('title');
});

// Hooks
onBeforeMount(async (): Promise<void> => {
  // Start initialize
  init();

  // Setup i18n
  await setupI18n();

  // Set title
  title.value = t('title');
});
</script>

<template>
  <AppHeader />
  <LanguageSelector />
  <div class="flex flex-col items-center relative w-full">
    <RouterView v-slot="{ Component }">
      <Transition>
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </Transition>
    </RouterView>
  </div>
  <AppFooter />
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  @apply transition-opacity;
}

.v-enter-from,
.v-leave-to {
  @apply opacity-0;
}

.v-leave-active {
  @apply absolute;
}
</style>
