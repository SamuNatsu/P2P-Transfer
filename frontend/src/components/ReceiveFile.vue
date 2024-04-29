<script lang="ts" setup>
import {
  ComputedRef,
  Ref,
  computed,
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
import MdiCheckBold from '~icons/mdi/check-bold';
import MdiCheckCircleOutline from '~icons/mdi/check-circle-outline';
import MdiContentSave from '~icons/mdi/content-save';
import MdiStopRemoveOutline from '~icons/mdi/stop-remove-outline';

// Injects
const { t } = useI18n();
const { status: mainStatus } = useStore();
const {
  fileName,
  fileSize,
  status,

  failReasonStr,
  fileSizeStr,
  percent,
  speedStr,
  statusStr,
  timeStr,

  interrupt,
  resetStore,
  saveMem,
  saveStream,
  start
} = useRecvFileStore();

// Reactive
const inputRef: Ref<HTMLInputElement | undefined> = ref();
const recvCode: Ref<string> = ref('');
const comStatus: Ref<'waiting' | 'transfering' | 'saving'> = ref('waiting');
const busy: Ref<boolean> = ref(false);

// Computed
const statusCls: ComputedRef<string> = computed((): string => {
  switch (status.value) {
    case 'idle':
      return 'text-neutral-400';
    case 'connecting':
      return 'text-yellow-400';
    case 'negotiating':
      return 'text-purple-400';
    case 'transfering':
      return 'text-emerald-400';
    case 'finished':
      return 'text-green-400';
    default:
      return 'text-red-400';
  }
});

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
const memorySave = (): void => {
  busy.value = true;
  saveMem().then((): void => {
    mainStatus.value = 'home';
  });
};
const streamSave = (): void => {
  busy.value = true;
  saveStream().then((): void => {
    mainStatus.value = 'home';
  });
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
    <div
      v-if="comStatus === 'waiting'"
      class="fixed flex inset-0 items-center justify-center p-8 -z-50">
      <div class="flex flex-col items-center">
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
    </div>
    <div
      v-if="comStatus !== 'waiting'"
      class="flex flex-wrap gap-4 items-center justify-center mt-12 mx-4">
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
    <div
      v-if="comStatus === 'transfering'"
      class="bg-neutral-700 mt-4 mx-4 p-2 rounded lg:max-w-3xl">
      <table>
        <tbody>
          <tr>
            <th class="text-left pr-4 whitespace-nowrap">
              {{ $t('index.file_name') }}
            </th>
            <td class="break-all">{{ fileName }}</td>
          </tr>
          <tr>
            <th class="text-left pr-4 whitespace-nowrap">
              {{ $t('index.file_size') }}
            </th>
            <td :title="fileSize.toString() + ' Byte(s)'">
              {{ fileSizeStr }}
            </td>
          </tr>
          <tr>
            <th class="text-left pr-4 whitespace-nowrap">
              {{ $t('index.status') }}
            </th>
            <td :class="statusCls">{{ statusStr }}</td>
          </tr>
          <tr v-if="status === 'transfering'">
            <th class="text-left pr-4 whitespace-nowrap">
              {{ $t('index.speed') }}
            </th>
            <td>{{ speedStr }}</td>
          </tr>
          <tr v-if="status === 'transfering'">
            <th class="text-left pr-4 whitespace-nowrap">
              {{ $t('index.time_left') }}
            </th>
            <td>{{ timeStr }}</td>
          </tr>
          <tr
            v-if="
              ['transfering', 'finished', 'failed', 'interrupted'].includes(
                status
              )
            ">
            <th class="text-left pr-4 whitespace-nowrap">
              {{ $t('index.progress') }}
            </th>
            <td>{{ (percent * 100).toFixed(1) }}%</td>
          </tr>
          <tr v-if="status === 'failed'">
            <th class="text-left pr-4 whitespace-nowrap">
              {{ $t('index.fail_reason') }}
            </th>
            <td class="text-red-400">{{ failReasonStr }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      v-if="comStatus === 'saving'"
      class="bg-neutral-700 mt-4 mx-4 p-2 rounded lg:max-w-3xl">
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
  </div>
</template>
