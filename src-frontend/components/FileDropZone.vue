<script setup lang="ts">
import { formatNumber } from '@/utils';
import { useId } from 'vue';

/* Icons */
import MdiFilePlusOutline from '~icons/mdi/file-plus-outline';

/* Models */
const file = defineModel<File | null>('file', { default: null });

// Emits
defineEmits<{ input: [Event] }>();

/* Reactive */
const id = useId();

/* Actions */
const onChange = (ev: Event) => {
  const el = ev.target as HTMLInputElement;
  file.value = el.files?.item(0) ?? null;
};
</script>

<template>
  <label :for="id">
    <div v-if="file === null" class="flex flex-col gap-4 items-center">
      <MdiFilePlusOutline class="text-3xl" />
      <p class="text-sm"><b>Click to select</b> or drag & drop</p>
    </div>
    <div v-else class="flex flex-col gap-4 items-center">
      <div class="flex flex-col font-mono">
        <p class="max-w-60 overflow-hidden text-ellipsis whitespace-nowrap">
          <b>Name:</b> {{ file.name }}
        </p>
        <p class="max-w-60 overflow-hidden text-ellipsis whitespace-nowrap">
          <b>MIME:</b> {{ file.type.length === 0 ? "unknown" : file.type }}
        </p>
        <p><b>Size:</b> {{ formatNumber(file.size, "B") }}</p>
      </div>
      <p class="text-sm"><b>Click to reselect</b> or drag & drop</p>
    </div>
    <input class="hidden" type="file" :id="id" @change="onChange" />
  </label>
</template>

<style lang="postcss" scoped>
@import "tailwindcss";

label {
  @apply bg-neutral-800 cursor-pointer transition-colors hover:bg-black;
  @apply border-2 border-dashed border-neutral-700;
  @apply flex flex-col h-36 items-center justify-center rounded w-72;
}
</style>
