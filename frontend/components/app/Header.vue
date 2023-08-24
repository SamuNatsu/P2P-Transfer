<script lang="ts" setup>
/* Inject */
const runtimeConfig = useRuntimeConfig();
</script>

<template>
  <header class="flex font-smiley gap-4 items-center relative select-none">
    <img class="h-16 w-16" draggable="false" src="/favicon.svg" />
    <h1 class="font-bold text-4xl">P2P Transfer</h1>
    <span class="absolute -bottom-2 right-2">{{ runtimeConfig.public.version }}</span>
  </header>
</template>
