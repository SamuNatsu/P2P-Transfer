<script lang="ts" setup>
import { Ref, ref } from 'vue';

// Stores
import { useStore } from '@/stores';
import { useRecvFileStore } from '@/stores/recv-file';

// Icons
import MdiCheckBold from '~icons/mdi/check-bold';

// Injects
const { status } = useStore();
const { saveMem, saveStream } = useRecvFileStore();

// Reactive
const busy: Ref<boolean> = ref(false);

// Actions
const memorySave = (): void => {
  busy.value = true;
  saveMem().then((): void => {
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
  <div class="bg-neutral-700 mt-4 mx-4 p-2 rounded lg:max-w-3xl">
    <button
      @click="memorySave"
      class="bg-blue-500 flex float-right gap-2 items-center mt-2 px-2 py-1 rounded disabled:bg-neutral-500 enabled:hover:bg-blue-600"
      :disabled="busy">
      <MdiCheckBold />
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
    <hr class="border-t-2 border-dashed my-4" />
    <button
      @click="streamSave"
      class="bg-blue-500 flex float-right gap-2 items-center mt-2 px-2 py-1 rounded disabled:bg-neutral-500 enabled:hover:bg-blue-600"
      :disabled="busy">
      <MdiCheckBold />
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
</template>
