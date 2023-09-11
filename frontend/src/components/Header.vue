<script lang="ts" setup>
/* Constants */
const version: string = __APP_VERSION__;
</script>

<template>
  <header
    class="flex font-smiley gap-4 items-center justify-center select-none">
    <img class="h-16 w-16" draggable="false" src="/logo.svg"/>
    <h1 class="font-bold relative transition-colors dark:text-white">
      <span class="text-4xl">P2P Transfer</span>
      <span class="absolute -bottom-5 right-2">
        {{ version }}
      </span>
    </h1>
  </header>
</template>
