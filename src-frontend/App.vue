<script setup lang="ts">
import { version } from '@/../package.json';
import { cacheDb } from '@/databases/cache';
import { onBeforeMount, onBeforeUnmount } from 'vue';

/* Hooks */
onBeforeMount(() => cacheDb.delete({ disableAutoOpen: false }));
onBeforeUnmount(() => cacheDb.delete());
</script>

<template>
  <div class="flex flex-col h-screen items-center w-full">
    <header class="flex gap-2 items-center mt-24 relative select-none">
      <img class="w-14" draggable="false" src="@/assets/logo.svg" />
      <h1 class="font-bold text-4xl">P2P Transfer</h1>
      <h2 class="absolute -bottom-1.5 right-0 text-sm">v{{ version }}</h2>
    </header>
    <div class="flex flex-col grow items-center mt-24">
      <RouterView v-slot="{ Component }">
        <Transition name="fade">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </div>
    <footer class="flex gap-8 mb-2 text-sm">
      <a
        href="https://github.com/SamuNatsu/P2P-Transfer"
        rel="noopener"
        target="_blank"
        >Github</a
      >
      <button class="link-like">Runtime Logs</button>
    </footer>
  </div>
</template>

<style lang="postcss" scoped>
@import "tailwindcss";

.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity;
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}

.fade-leave-active {
  @apply absolute;
}
</style>
