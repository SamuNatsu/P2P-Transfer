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
import MdiCheckCircleOutline from '~icons/mdi/check-circle-outline';
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
  start
} = useRecvFileStore();

// Reactive
const inputRef: Ref<HTMLInputElement | undefined> = ref();
const recvCode: Ref<string> = ref('');
const confirmed: Ref<boolean> = ref(false);

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

  confirmed.value = true;
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
    <div
      v-if="!confirmed"
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
      v-if="confirmed"
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
    </div>
    <div
      v-if="confirmed"
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
  </div>
</template>
