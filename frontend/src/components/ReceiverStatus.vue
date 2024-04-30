<script lang="ts" setup>
import { ComputedRef, computed } from 'vue';

// Stores
import { useRecvFileStore } from '@/stores/recv-file';

// Injects
const {
  fileName,
  fileSize,
  metaGot,
  status,

  failReasonStr,
  fileSizeStr,
  percent,
  speedStr,
  statusStr,
  timeStr
} = useRecvFileStore();

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
</script>

<template>
  <div class="bg-neutral-700 mt-4 mx-4 p-2 rounded lg:max-w-3xl">
    <table>
      <tbody>
        <tr v-if="metaGot">
          <th class="text-left pr-4 whitespace-nowrap">
            {{ $t('index.file_name') }}
          </th>
          <td class="break-all">{{ fileName }}</td>
        </tr>
        <tr v-if="metaGot">
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
</template>
