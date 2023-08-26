<script lang="ts" setup>
/* Properties */
defineProps<{
  id: string;
}>();

/* Emits */
defineEmits<{
  select: [ev: Event]
}>();
</script>

<template>
  <label
    class="bg-white border-2 cursor-pointer font-bold px-4 rounded-3xl select-none transition-colors hover:text-white"
    :for="id">
    <slot></slot>
    <input
      @change="$emit('select', $event)"
      class="hidden"
      :id="id"
      multiple="false"
      type="file"/>
  </label>
</template>
