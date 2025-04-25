<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue';

/* Models */
const code = defineModel('code', { default: '' });
const completed = defineModel('completed', { default: false });

// Properties
const props = defineProps<{ length: number }>();

/* Reactive */
const refRoot = useTemplateRef('root');
const data = ref(
  Array(props.length)
    .fill(null)
    .map((_) => ''),
);

/* Actions */
const onInput = (ev: Event, idx: number) => {
  const el = ev.target as HTMLInputElement;
  const newVal = el.value
    .trim()
    .replace(/[^0-9]/g, '')
    .slice(-1);
  el.value = newVal;
  data.value[idx] = newVal;
  code.value = data.value.join('');
  completed.value = code.value.length === props.length;

  if (newVal.length === 0) {
    return;
  }

  if (idx + 1 < props.length) {
    refRoot.value?.querySelectorAll('input')[idx + 1]?.focus();
  } else {
    refRoot.value?.querySelectorAll('input')[idx]?.blur();
  }
};

/* Hooks */
onMounted(() => {
  refRoot.value?.querySelector('input')?.focus();
});
</script>

<template>
  <div class="flex font-bold gap-4 text-xl" ref="root">
    <template v-for="(_, idx) in data" :key="idx">
      <input
        class="border-b-4 h-8 outline-none text-center transition-colors w-8 focus:border-blue-500"
        type="text"
        :value="data[idx]"
        @input="onInput($event, idx)"
      />
    </template>
  </div>
</template>
