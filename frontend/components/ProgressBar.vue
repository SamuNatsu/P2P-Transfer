<script lang="ts" setup>
/* Properties */
defineProps<{
  progress: number;
  color?: string;
}>();
</script>

<template>
  <div class="border-2 border-gray-400 h-5 overflow-hidden relative rounded-xl">
    <div
      class="h-full text-base"
      :class="color"
      :style="{ width: `${progress}%` }">
    </div>
    <div
      class="absolute flex inset-0 items-center justify-center text-sm">
      {{ progress.toFixed(1) }}%
    </div>
  </div>
</template>
