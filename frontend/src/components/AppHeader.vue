<script lang="ts" setup>
import { version } from '@/../package.json';
</script>

<template>
  <header class="flex gap-2 items-center mt-12 select-none">
    <img class="h-16" draggable="false" src="/favicon.svg" />
    <div class="relative">
      <h1 class="font-bold text-4xl">P2P Transfer</h1>
      <h2 class="absolute -bottom-4 right-0 text-sm">v{{ version }}</h2>
    </div>
  </header>
</template>
