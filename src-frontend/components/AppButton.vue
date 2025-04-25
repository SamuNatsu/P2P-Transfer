<script setup lang="ts">
import { computed } from 'vue';

// Properties
const props = defineProps<{
  variant: 'info' | 'success' | 'warn' | 'error';
  label: string;
}>();

/* Computed */
const colorClass = computed(() => {
  switch (props.variant) {
    case 'info':
      return 'bg-blue-500 hover:bg-blue-600';
    case 'success':
      return 'bg-green-500 hover:bg-green-600';
    case 'warn':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'error':
      return 'bg-red-500 hover:bg-red-600';
  }
});
</script>

<template>
  <button :class="colorClass">
    <slot name="icon"></slot>
    <span>{{ label }}</span>
  </button>
</template>

<style lang="postcss" scoped>
@import "tailwindcss";

button {
  @apply flex gap-2 items-center px-4 py-2;
  @apply rounded transition-colors;
  @apply disabled:bg-neutral-500 disabled:opacity-50;
  @apply cursor-pointer disabled:cursor-default;
}
</style>
