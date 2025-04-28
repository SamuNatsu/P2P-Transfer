<script setup lang="ts">
import { useReceiver } from '@/stores/receiver';
import { formatNumber, formatTime, splitInteger } from '@/utils';

/* Components */
import ProgressBar from '@/components/ProgressBar.vue';

/* Stores */
const {
  state,
  error,
  code,
  fileName,
  fileMime,
  fileSize,
  available,
  progress,
  remainingTime,
  speed,
  stateStr,
  stateCls,
} = useReceiver();
</script>

<template>
  <div class="bg-neutral-800 border-2 border-neutral-700 p-2 rounded">
    <table>
      <tbody>
        <tr>
          <th>Code</th>
          <td>{{ code }}</td>
        </tr>
        <tr v-if="fileName !== null">
          <th>Name</th>
          <td
            class="max-w-50 overflow-hidden text-ellipsis whitespace-nowrap"
            :title="fileName"
          >
            {{ fileName }}
          </td>
        </tr>
        <tr v-if="fileMime !== null">
          <th>Type</th>
          <td
            class="max-w-50 overflow-hidden text-ellipsis whitespace-nowrap"
            :title="fileMime"
          >
            {{ fileMime }}
          </td>
        </tr>
        <tr v-if="fileSize !== null">
          <th>Size</th>
          <td :title="`${splitInteger(fileSize)} Byte(s)`">
            {{ formatNumber(fileSize, "B") }}
          </td>
        </tr>
        <tr>
          <th>State</th>
          <td :class="stateCls">{{ stateStr }}</td>
        </tr>
        <tr v-if="available === false">
          <td colspan="2">
            <p class="max-w-60 mt-4 text-center text-red-500">
              File has been received by others
            </p>
          </td>
        </tr>
        <template v-if="state === 'recv'">
          <tr>
            <th>SPD.</th>
            <td>{{ formatNumber(speed, "B/s") }}</td>
          </tr>
          <tr>
            <th>RT.</th>
            <td>{{ formatTime(remainingTime) }}</td>
          </tr>
          <tr>
            <td colspan="2"><ProgressBar :percent="progress" /></td>
          </tr>
        </template>
        <tr v-if="error !== null">
          <td colspan="2">
            <p class="max-w-60 mt-4 text-center text-red-500">
              {{ error.message }}
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="postcss" scoped>
@import "tailwindcss";

td,
th {
  @apply px-1 py-0.5;
}

td {
  @apply font-mono;
}
</style>
