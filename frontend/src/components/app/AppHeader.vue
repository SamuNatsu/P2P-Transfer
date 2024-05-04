<script lang="ts" setup>
import { version } from '@/../package.json';

// Stores
import { useStore } from '@/stores';

// Components
import Logo from '@/assets/logo.svg';

// Injects
const { showDebug } = useStore();
</script>

<template>
  <header class="flex gap-2 items-center mt-12 select-none">
    <Logo @click="showDebug = true" class="h-16 w-16" />
    <div class="relative">
      <h1 class="font-bold text-4xl">P2P Transfer</h1>
      <h2 class="absolute -bottom-4 right-0 text-sm">v{{ version }}</h2>
    </div>
  </header>
</template>
