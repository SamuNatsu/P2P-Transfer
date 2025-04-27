<script setup lang="ts">
// Properties
defineProps<{ percent: number }>();
</script>

<template>
  <div class="bg-green-900 overflow-hidden relative rounded-xl w-full z-0">
    <div
      class="absolute bg-green-600 h-full top-0 z-0"
      :style="`width:${percent}%`"
    ></div>
    <p class="font-mono relative text-center z-10">{{ percent.toFixed(1) }}%</p>
  </div>
</template>
