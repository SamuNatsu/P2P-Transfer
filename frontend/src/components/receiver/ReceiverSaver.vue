<script lang="ts" setup>
import { Ref, ref } from 'vue';

// Stores
import { useStore } from '@/stores';
import { useRecvFileStore } from '@/stores/recv-file';

// Injects
const { status } = useStore();
const { saveMemory, saveStream } = useRecvFileStore();

// Reactive
const busy: Ref<boolean> = ref(false);

// Actions
const memorySave = (): void => {
  busy.value = true;
  saveMemory().then((): void => {
    status.value = 'home';
  });
};
const streamSave = (): void => {
  busy.value = true;
  saveStream().then((): void => {
    status.value = 'home';
  });
};
</script>

<template>
  <div>
    <div
      v-if="busy"
      class="flex gap-4 items-center justify-center mt-12 mx-4 p-2 lg:max-w-3xl">
      <div
        class="animate-spin border-4 border-r-transparent h-12 rounded-full w-12"></div>
      <h1 class="font-bold text-2xl">{{ $t('index.saving.$') }}</h1>
    </div>
    <div v-else class="bg-neutral-700 mt-4 mx-4 p-2 rounded lg:max-w-3xl">
      <button
        @click="memorySave"
        class="bg-blue-500 flex float-right gap-2 items-center px-2 py-1 rounded hover:bg-blue-600">
        {{ $t('btn.start') }}
      </button>
      <h1 class="font-bold my-2 text-xl">{{ $t('index.use_memory') }}</h1>
      <p>{{ $t('index.saving.text[0]') }}</p>
      <p>
        <b>{{ $t('index.saving.pros') }}</b
        >{{ $t('index.saving.text[1]') }}
      </p>
      <p>
        <b>{{ $t('index.saving.cons') }}</b
        >{{ $t('index.saving.text[2]') }}
      </p>
      <hr class="border-t-2 border-dashed mb-2 mt-4" />
      <button
        @click="streamSave"
        class="bg-blue-500 flex float-right gap-2 items-center px-2 py-1 rounded enabled:hover:bg-blue-600">
        {{ $t('btn.start') }}
      </button>
      <h1 class="font-bold my-2 text-xl">{{ $t('index.use_stream') }}</h1>
      <p>{{ $t('index.saving.text[3]') }}</p>
      <p>
        <b>{{ $t('index.saving.pros') }}</b
        >{{ $t('index.saving.text[4]') }}
      </p>
      <p>
        <b>{{ $t('index.saving.cons') }}</b
        >{{ $t('index.saving.text[5]') }}
      </p>
    </div>
  </div>
</template>
