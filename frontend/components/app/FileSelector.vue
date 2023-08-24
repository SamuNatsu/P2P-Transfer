<script lang="ts" setup>
/* Properties */
defineProps<{
  id: string;
  disabled: boolean;
}>();

/* Emits */
defineEmits<{
  select: [ev: Event]
}>();
</script>

<template>
  <label class="bg-white border-2 cursor-pointer font-bold px-4 py-1 rounded-3xl select-none transition-colors hover:text-white" :class="disabled ? '!bg-white !cursor-not-allowed !opacity-50 !text-black' : ''" :for="id">
    <slot></slot>
    <input @change="$emit('select', $event)" class="hidden" :disabled="disabled" :id="id" multiple="false" type="file" />
  </label>
</template>
