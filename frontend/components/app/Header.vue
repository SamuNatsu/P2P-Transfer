<script lang="ts" setup>
/* Inject */
const runtimeConfig = useRuntimeConfig();
</script>

<template>
  <header class="absolute flex font-smiley gap-4 items-center select-none top-24">
    <img class="h-16 w-16" draggable="false" src="/favicon.svg" />
    <h1 class="font-bold text-4xl">P2P Transfer</h1>
    <span class="absolute -bottom-2 right-2">{{ runtimeConfig.public.version }}</span>
  </header>
</template>
