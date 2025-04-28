<script setup lang="ts">
import { useSender } from '@/stores/sender';
import { formatNumber, formatTime, splitInteger } from '@/utils';

/* Icons */
import MdiContentCopy from '~icons/mdi/content-copy';

/* Components */
import ProgressBar from '@/components/ProgressBar.vue';

/* Stores */
const {
  state,
  error,
  file,
  code,
  progress,
  remainingTime,
  speed,
  stateStr,
  stateCls,
} = useSender();

/* Actions */
const copyCode = () => {
  const url = new URL(location.href);
  url.pathname = `${import.meta.env.BASE_URL}/receive`.replace('//', '/');
  url.hash = `#${code.value}`;

  navigator.clipboard
    .writeText(url.href)
    .then(() => {
      alert('Share link copied');
    })
    .catch(() => {
      alert('Fail to write the clipboard');
    });
};
</script>

<template>
  <div class="bg-neutral-800 border-2 border-neutral-700 p-2 rounded">
    <table>
      <tbody>
        <tr>
          <th>Name</th>
          <td
            class="max-w-50 overflow-hidden text-ellipsis whitespace-nowrap"
            :title="file?.name"
          >
            {{ file?.name }}
          </td>
        </tr>
        <tr>
          <th>Type</th>
          <td
            class="max-w-50 overflow-hidden text-ellipsis whitespace-nowrap"
            :title="file?.type"
          >
            {{ file?.type }}
          </td>
        </tr>
        <tr>
          <th>Size</th>
          <td :title="`${splitInteger(file!.size)} Byte(s)`">
            {{ formatNumber(file!.size, "B") }}
          </td>
        </tr>
        <tr>
          <th>State</th>
          <td :class="stateCls">{{ stateStr }}</td>
        </tr>
        <tr v-if="code !== null">
          <th>Code</th>
          <td class="flex gap-2 items-center">
            <span>{{ code }}</span>
            <button
              class="cursor-pointer transition-colors hover:text-blue-500"
              @click="copyCode()"
            >
              <MdiContentCopy class="text-sm" />
            </button>
          </td>
        </tr>
        <tr v-if="state === 'send'">
          <th>SPD.</th>
          <td>{{ formatNumber(speed, "B/s") }}</td>
        </tr>
        <tr v-if="state === 'send'">
          <th>RT.</th>
          <td>{{ formatTime(remainingTime) }}</td>
        </tr>
        <tr v-if="state === 'send'">
          <td colspan="2"><ProgressBar :percent="progress" /></td>
        </tr>
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
