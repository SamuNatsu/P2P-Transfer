<script lang="ts" setup>
import { ComputedRef, computed } from 'vue';

// Stores
import { useStore } from '@/stores';
import { useSendFileStore } from '@/stores/send-file';

// Icons
import MdiArrowBackCircle from '~icons/mdi/arrow-back-circle';
import MdiRocketLaunchOutline from '~icons/mdi/rocket-launch-outline';
import MdiStopRemoveOutline from '~icons/mdi/stop-remove-outline';

// Injects
const { mode } = useStore();
const {
  file,
  status,
  code,
  fileSize,
  statusStr,
  unregisterListeners,
  startSend,
  interrupt
} = useSendFileStore();

// Computed
const statusCls: ComputedRef<string> = computed((): string => {
  switch (status.value) {
    case 'idle':
      return 'text-neutral-400';
    case 'registering':
      return 'text-yellow-400';
    case 'waiting':
      return 'text-blue-400';
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

// Actions
const back = (): void => {
  unregisterListeners();
  mode.value = null;
};
</script>

<template>
  <div class="flex flex-wrap gap-4 items-center justify-center mt-8 mx-4">
    <button
      @click="back"
      class="bg-red-500 flex gap-2 items-center p-2 rounded enabled:hover:bg-red-400 disabled:opacity-25"
      :disabled="
        !['idle', 'finished', 'failed', 'interrupted'].includes(status)
      ">
      <MdiArrowBackCircle class="text-2xl" />
      <span>{{ $t('index.back') }}</span>
    </button>
    <button
      v-if="status === 'idle'"
      @click="startSend"
      class="bg-cyan-500 flex gap-2 items-center p-2 rounded hover:bg-cyan-600">
      <MdiRocketLaunchOutline class="text-2xl" />
      <span>{{ $t('index.start_sending') }}</span>
    </button>
    <button
      v-if="status !== 'idle'"
      @click="interrupt"
      class="bg-yellow-500 flex gap-2 items-center p-2 rounded enabled:hover:bg-yellow-600 disabled:opacity-25"
      :disabled="['finished', 'failed', 'interrupted'].includes(status)">
      <MdiStopRemoveOutline class="text-2xl" />
      <span>{{ $t('index.interrupt') }}</span>
    </button>
  </div>
  <div
    v-if="file !== null"
    class="bg-neutral-700 mt-4 mx-4 p-2 rounded lg:max-w-3xl">
    <table>
      <tbody>
        <tr>
          <th class="text-left pr-4 whitespace-nowrap">
            {{ $t('index.file_name') }}
          </th>
          <td class="break-all">{{ file.name }}</td>
        </tr>
        <tr>
          <th class="text-left pr-4 whitespace-nowrap">
            {{ $t('index.file_size') }}
          </th>
          <td :title="file.size.toString() + ' Byte(s)'">
            {{ fileSize }}
          </td>
        </tr>
        <tr>
          <th class="text-left pr-4 whitespace-nowrap">
            {{ $t('index.status') }}
          </th>
          <td :class="statusCls">{{ statusStr }}</td>
        </tr>
        <tr v-if="code !== null">
          <th class="text-left pr-4 whitespace-nowrap">
            {{ $t('index.receive_code') }}
          </th>
          <td>{{ code }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
