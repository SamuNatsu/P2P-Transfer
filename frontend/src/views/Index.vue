<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

// Stores
import { useStore } from '@/stores';

// Components
import { Icon } from '@iconify/vue';

// Injects
const { t } = useI18n();
const { initState, selectedFile, selectedFileSize, selectFile } = useStore();
</script>

<template>
  <div>
    <Transition>
      <div
        v-if="initState === 'waiting'"
        class="fixed flex inset-0 items-center justify-center -z-50">
        <div
          class="animate-spin border-4 border-r-transparent h-12 rounded-full w-12"></div>
      </div>
      <div
        v-else-if="initState === 'unsupport'"
        class="fixed flex flex-col inset-0 items-center justify-center p-8 -z-50">
        <Icon class="text-6xl text-red-500" icon="mdi:warning-outline" />
        <h1 class="break-all text-xl">{{ t('fail.unsupport') }}</h1>
      </div>
      <div
        v-else-if="initState === 'fail'"
        class="fixed flex flex-col inset-0 items-center justify-center p-8 -z-50">
        <Icon class="text-6xl text-red-500" icon="mdi:warning-outline" />
        <h1 class="break-all text-xl">{{ t('fail.connect_to_server') }}</h1>
      </div>
      <div v-else class="flex flex-col items-center justify-center mt-4">
        <div class="bg-green-600 py-2 text-center w-screen">
          {{ t('index.server_connected') }}
        </div>
        <div class="flex flex-wrap gap-4 items-center justify-center mt-8 mx-4">
          <button
            v-if="selectedFile === null"
            @click="selectFile"
            class="bg-blue-500 flex gap-2 items-center p-2 rounded hover:bg-blue-600">
            <Icon class="text-2xl" icon="mdi:cloud-upload-outline" />
            <span>{{ t('index.send_file') }}</span>
          </button>
          <button
            v-if="selectedFile === null"
            class="bg-orange-500 flex gap-2 items-center p-2 rounded hover:bg-orange-400">
            <Icon class="text-2xl" icon="mdi:cloud-download-outline" />
            <span>{{ t('index.receive_file') }}</span>
          </button>
          <button
            v-if="selectedFile !== null"
            @click="selectFile"
            class="bg-red-500 flex gap-2 items-center p-2 rounded hover:bg-red-400">
            <Icon class="text-2xl" icon="mdi:restore" />
            <span>{{ t('index.reselect_file') }}</span>
          </button>
          <button
            v-if="selectedFile !== null"
            class="bg-cyan-500 flex gap-2 items-center p-2 rounded hover:bg-cyan-600">
            <Icon class="text-2xl" icon="mdi:rocket-launch-outline" />
            <span>{{ t('index.start_sending') }}</span>
          </button>
        </div>
        <div
          v-if="selectedFile !== null"
          class="bg-neutral-700 mt-4 mx-4 p-2 rounded">
          <table>
            <tbody>
              <tr>
                <th class="text-left pr-4 whitespace-nowrap">{{ t('index.file_name') }}</th>
                <td class="break-all">{{ selectedFile.name }}</td>
              </tr>
              <tr>
                <th class="text-left pr-4 whitespace-nowrap">{{ t('index.file_size') }}</th>
                <td :title="selectedFile.size.toString() + ' Byte(s)'">
                  {{ selectedFileSize }}
                </td>
              </tr>
              <tr>
                <th class="text-left pr-4 whitespace-nowrap">{{ t('index.status') }}</th>
                <td></td>
              </tr>
              <tr>
                <th class="text-left pr-4 whitespace-nowrap">{{ t('index.receive_code') }}</th>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.25s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
