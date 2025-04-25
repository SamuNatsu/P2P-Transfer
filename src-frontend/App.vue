<script setup lang="ts">
import { version } from '@/../package.json';
</script>

<template>
  <div class="flex flex-col gap-8 items-center w-full">
    <header class="flex gap-2 items-center mt-24 relative select-none">
      <img class="w-16" draggable="false" src="@/assets/logo.svg" />
      <h1 class="font-bold text-4xl">P2P Transfer</h1>
      <h2 class="absolute -bottom-1 right-0 text-sm">v{{ version }}</h2>
    </header>
    <RouterView />
    <footer class="flex gap-8 text-sm">
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
