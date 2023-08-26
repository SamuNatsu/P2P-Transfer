<script lang="ts" setup>
/* Properties */
defineProps<{
  input: boolean;
}>();

/* Emits */
defineEmits<{
  'update:input': [value: boolean]
}>();
</script>

<template>
  <div class="flex flex-col items-center overflow-hidden rounded-lg">
    <div class="flex font-bold items-center w-full">
      <button
        @click="$emit('update:input', true)"
        class="py-2 w-1/2"
        :class="input ? 'bg-green-300' : 'bg-gray-200'">
        {{ $t('button.blob_mode') }}
      </button>
      <button
        @click="$emit('update:input', false)"
        class="py-2 w-1/2"
        :class="input ? 'bg-gray-200' : 'bg-green-300'">
        {{ $t('button.stream_mode') }}
      </button>
    </div>
    <div class="bg-green-300 px-4 py-4 w-80">
      {{ $t(input ? 'ui.blob_mode' : 'ui.stream_mode') }}
    </div>
  </div>
</template>
