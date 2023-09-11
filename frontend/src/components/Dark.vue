<script lang="ts" setup>
/* Injects */
const isDark = useDark({ disableTransition: false });
const toggleDark = useToggle(isDark);
</script>

<template>
  <button @click="toggleDark()">
    <img v-if="isDark" class="h-5 w-5" src="/imgs/moon.svg"/>
    <img v-else class="h-5 w-5" src="/imgs/sun.svg"/>
  </button>
</template>
