<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from 'vue';

/* Models */
const code = defineModel('code', { default: '' });
const completed = defineModel('completed', { default: false });

// Properties
const props = defineProps<{ length?: number; defaultData?: string }>();

/* Reactive */
const refRoot = useTemplateRef('root');
const data = ref(
  props.defaultData !== undefined
    ? Array.from(props.defaultData)
    : Array(props.length)
        .fill(null)
        .map((_) => ''),
);

/* Actions */
const onInput = (ev: Event, idx: number) => {
  const el = ev.target as HTMLInputElement;
  const newVal = el.value
    .trim()
    .replace(/[^0-9a-zA-Z]/g, '')
    .slice(-1);
  el.value = newVal;
  data.value[idx] = newVal;
  data.value = data.value.slice();

  if (newVal.length === 0) {
    return;
  }

  if (idx + 1 < data.value.length) {
    refRoot.value?.querySelectorAll('input')[idx + 1]?.focus();
  } else {
    refRoot.value?.querySelectorAll('input')[idx]?.blur();
  }
};

const onKeyDown = (ev: KeyboardEvent, idx: number) => {
  const el = ev.target as HTMLInputElement;
  if (ev.key === 'Backspace' || ev.key === 'Delete') {
    ev.preventDefault();
    ev.stopPropagation();

    el.value = '';
    data.value[idx] = '';
    data.value = data.value.slice();

    if (idx > 0) {
      refRoot.value?.querySelectorAll('input')[idx - 1]?.focus();
    }
  }
};

/* Watches */
watch(data, (newValue) => {
  code.value = newValue.join('');
  completed.value = newValue.join('').length === data.value.length;
});

/* Hooks */
onMounted(() => {
  if (props.defaultData === undefined) {
    refRoot.value?.querySelector('input')?.focus();
  } else {
    code.value = props.defaultData;
    completed.value = true;
  }
});
</script>

<template>
  <div class="flex font-bold gap-4 text-xl" ref="root">
    <input
      v-for="(val, idx) in data"
      type="text"
      :value="val"
      @input="onInput($event, idx)"
      @keydown="onKeyDown($event, idx)"
    />
  </div>
</template>

<style lang="postcss" scoped>
@import "tailwindcss";

input {
  @apply font-mono;
  @apply border-b-4 h-8 outline-none text-center w-8;
  @apply transition-colors focus:border-blue-500;
}
</style>
