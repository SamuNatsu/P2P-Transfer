<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue';

// Properties
const props = defineProps<{ length: number }>();

/* Reactive */
const refRoot = useTemplateRef('root');
const data = ref<string[]>(
  Array(props.length)
    .fill(null)
    .map((_) => ''),
);

/* Actions */
const onInput = (ev: Event, idx: number) => {
  const el = ev.target as HTMLInputElement;
  el.value = el.value
    .trim()
    .replace(/[^0-9]/g, '')
    .slice(-1);
  data.value[idx] = el.value;
  if (el.value.length === 0) {
  }
  if (idx < props.length) {
    refRoot.value?.querySelectorAll('input')[idx + 1]?.focus();
  } else {
    el.blur();
  }
};

/* Hooks */
onMounted(() => {
  refRoot.value?.querySelector('input')?.focus();
});
</script>

<template>
  <div class="flex gap-4" ref="root">
    <template v-for="(_, idx) in data" :key="idx">
      <input
        class="border h-8 rounded text-center w-8"
        type="text"
        :value="data[idx]"
        @input="onInput($event, idx)"
      />
    </template>
  </div>
</template>
