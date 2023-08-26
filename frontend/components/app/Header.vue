<script lang="ts" setup>
/* Inject */
const runtimeConfig = useRuntimeConfig();
</script>

<template>
  <header class="flex font-smiley gap-4 items-center justify-center select-none">
    <SvgoLogo class="h-16 w-16"/>
    <h1 class="font-bold relative">
      <span class="text-4xl">P2P Transfer</span>
      <span class="absolute -bottom-5 right-2">{{ runtimeConfig.public.version }}</span>
    </h1>
  </header>
</template>
