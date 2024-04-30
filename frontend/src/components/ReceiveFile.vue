<script lang="ts" setup>
import {
  Ref,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue';
import { useI18n } from 'vue-i18n';

// Stores
import { useStore } from '@/stores';
import { useRecvFileStore } from '@/stores/recv-file';

// Icons
import MdiArrowBackCircle from '~icons/mdi/arrow-back-circle';
import MdiCheckCircleOutline from '~icons/mdi/check-circle-outline';
import MdiContentSave from '~icons/mdi/content-save';
import MdiStopRemoveOutline from '~icons/mdi/stop-remove-outline';

// Components
import FileSaver from '@/components/FileSaver.vue';
import ReceiverStatus from '@/components/ReceiverStatus.vue';

// Injects
const { t } = useI18n();
const { status: mainStatus } = useStore();
const {
  status,

  interrupt,
  resetStore,
  start
} = useRecvFileStore();

// Reactive
const inputRef: Ref<HTMLInputElement | undefined> = ref();
const recvCode: Ref<string> = ref('');
const comStatus: Ref<'waiting' | 'transfering' | 'saving'> = ref('waiting');

// Watches
watch(recvCode, (): void => {
  recvCode.value = recvCode.value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 8);
});

// Actions
const confirm = (): void => {
  if (recvCode.value.length !== 8) {
    alert(t('fail.invalid_code'));
    return;
  }

  comStatus.value = 'transfering';
  start(recvCode.value);
};

// Hooks
onBeforeMount((): void => {
  resetStore();
});
onBeforeUnmount((): void => {
  resetStore();
});
onMounted((): void => {
  inputRef.value!.focus();
});
</script>

<template>
  <div>
    <div v-if="comStatus === 'waiting'" class="flex flex-col items-center">
      <h1 class="font-bold text-2xl">{{ $t('index.input_code') }}</h1>
      <input
        v-model="recvCode"
        class="bg-transparent border-b-2 border-b-blue-400 font-bold mt-8 outline-none p-2 text-blue-400 text-center text-2xl w-60"
        ref="inputRef"
        type="text" />
      <div class="flex flex-wrap gap-4 items-center justify-center mt-4 mx-4">
        <button
          @click="mainStatus = 'home'"
          class="bg-red-500 flex gap-2 items-center px-4 py-2 rounded hover:bg-red-400">
          <MdiArrowBackCircle class="text-2xl" />
          <span>{{ $t('btn.back') }}</span>
        </button>
        <button
          @click="confirm"
          class="bg-green-500 flex gap-2 items-center px-4 py-2 rounded hover:bg-green-400">
          <MdiCheckCircleOutline class="text-2xl" />
          <span class="font-bold">{{ $t('btn.confirm') }}</span>
        </button>
      </div>
    </div>
    <div
      v-if="comStatus !== 'waiting'"
      class="flex flex-wrap gap-4 items-center justify-center mx-4">
      <button
        v-if="['idle', 'finished', 'failed', 'interrupted'].includes(status)"
        @click="mainStatus = 'home'"
        class="bg-red-500 flex gap-2 items-center px-4 py-2 rounded hover:bg-red-400">
        <MdiArrowBackCircle class="text-2xl" />
        <span>{{ $t('btn.back') }}</span>
      </button>
      <button
        v-if="!['idle', 'finished', 'failed', 'interrupted'].includes(status)"
        @click="interrupt"
        class="bg-yellow-500 flex gap-2 items-center px-4 py-2 rounded hover:bg-yellow-600">
        <MdiStopRemoveOutline class="text-2xl" />
        <span>{{ $t('btn.interrupt') }}</span>
      </button>
      <button
        v-if="status === 'finished' && comStatus === 'transfering'"
        @click="comStatus = 'saving'"
        class="bg-green-500 flex gap-2 items-center px-4 py-2 rounded hover:bg-green-600">
        <MdiContentSave class="text-2xl" />
        <span>{{ $t('btn.save_file') }}</span>
      </button>
    </div>
    <Transition>
      <ReceiverStatus v-if="comStatus === 'transfering'" />
      <FileSaver v-else-if="comStatus === 'saving'" />
    </Transition>
  </div>
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

.v-leave-active {
  @apply absolute;
}
</style>
