<script lang="ts" setup>
import { useTitle } from '@vueuse/core';
import { onBeforeMount, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { setupI18n } from '@/i18n';

// Components
import AppHeader from '@/components/app/AppHeader.vue';
import AppNav from '@/components/app/AppNav.vue';
import LanguageSelector from '@/components/LanguageSelector.vue';

import { RouterView } from 'vue-router';

// Injects
const title = useTitle();
const { locale, t } = useI18n();

// Watches
watch(locale, (): void => {
  title.value = t('title');
});

// Hooks
onBeforeMount((): void => {
  setupI18n();
});
</script>

<template>
  <AppHeader />
  <AppNav />
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
