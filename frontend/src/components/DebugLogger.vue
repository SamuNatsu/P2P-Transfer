<script lang="ts" setup>
import { ComputedRef, Ref, computed, ref } from 'vue';

// Stores
import { LogLevel, useStore } from '@/stores';

// Icons
import MdiCloseBoxOutline from '~icons/mdi/close-box-outline';
import MdiBugOutline from '~icons/mdi/bug-outline';

// Injects
const { debugLogs, showDebug } = useStore();

// Reactive
const filter: Ref<boolean[]> = ref([false, true, true, true, true]);

// Computed
const filteredLogs: ComputedRef<[LogLevel, string][]> = computed(
  (): [LogLevel, string][] =>
    debugLogs.value.filter(
      ([lv]): boolean =>
        (lv === 'TRACE' && filter.value[0]) ||
        (lv === 'DEBUG' && filter.value[1]) ||
        (lv === 'INFO' && filter.value[2]) ||
        (lv === 'WARN' && filter.value[3]) ||
        (lv === 'ERROR' && filter.value[4])
    )
);

// Actions
const getCls = (lv: LogLevel): string => {
  switch (lv) {
    case 'TRACE':
      return 'text-neutral-400';
    case 'DEBUG':
      return 'text-blue-500';
    case 'INFO':
      return 'text-green-500';
    case 'WARN':
      return 'text-yellow-500';
    case 'ERROR':
      return 'text-red-500';
  }
};
</script>

<template>
  <Transition>
    <div
      v-if="showDebug"
      class="bg-neutral-700 fixed flex flex-col inset-0 p-1">
      <div class="flex items-center justify-between">
        <div class="flex gap-1 items-center">
          <MdiBugOutline class="text-3xl" />
          <h1 class="font-bold text-xl">Debug Logger</h1>
        </div>
        <button @click="showDebug = false">
          <MdiCloseBoxOutline class="text-xl" />
        </button>
      </div>
      <div class="flex gap-4 items-center select-none">
        <label class="flex gap-1 items-center">
          <span>T</span>
          <input v-model="filter[0]" type="checkbox" />
        </label>
        <label class="flex gap-1 items-center">
          <span>D</span>
          <input v-model="filter[1]" type="checkbox" />
        </label>
        <label class="flex gap-1 items-center">
          <span>I</span>
          <input v-model="filter[2]" type="checkbox" />
        </label>
        <label class="flex gap-1 items-center">
          <span>W</span>
          <input v-model="filter[3]" type="checkbox" />
        </label>
        <label class="flex gap-1 items-center">
          <span>E</span>
          <input v-model="filter[4]" type="checkbox" />
        </label>
      </div>
      <div class="bg-neutral-900 flex-grow overflow-y-auto px-1 w-full">
        <p
          v-for="[lv, msg] in filteredLogs"
          class="font-mono text-sm"
          :class="getCls(lv)">
          {{ msg }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  @apply transition-opacity;
}

.v-enter-from,
.v-leave-to {
  @apply opacity-0;
}
</style>
