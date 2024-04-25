<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

// Stores
import { useStore } from '@/stores';

// Icons
import MdiWarningOutline from '~icons/mdi/warning-outline';
import MdiCloudUploadOutline from '~icons/mdi/cloud-upload-outline';
import MdiCloudDownloadOutline from '~icons/mdi/cloud-download-outline';
import MdiRestore from '~icons/mdi/restore';
import MdiRocketLaunchOutline from '~icons/mdi/rocket-launch-outline';

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
        <MdiWarningOutline class="text-6xl text-red-500" />
        <h1 class="break-all text-xl">{{ t('fail.unsupport') }}</h1>
      </div>
      <div
        v-else-if="initState === 'fail'"
        class="fixed flex flex-col inset-0 items-center justify-center p-8 -z-50">
        <MdiWarningOutline class="text-6xl text-red-500" />
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
            <MdiCloudUploadOutline class="text-2xl" />
            <span>{{ t('index.send_file') }}</span>
          </button>
          <button
            v-if="selectedFile === null"
            class="bg-orange-500 flex gap-2 items-center p-2 rounded hover:bg-orange-400">
            <MdiCloudDownloadOutline class="text-2xl" />
            <span>{{ t('index.receive_file') }}</span>
          </button>
          <button
            v-if="selectedFile !== null"
            @click="selectFile"
            class="bg-red-500 flex gap-2 items-center p-2 rounded hover:bg-red-400">
            <MdiRestore class="text-2xl" />
            <span>{{ t('index.reselect_file') }}</span>
          </button>
          <button
            v-if="selectedFile !== null"
            class="bg-cyan-500 flex gap-2 items-center p-2 rounded hover:bg-cyan-600">
            <MdiRocketLaunchOutline class="text-2xl" />
            <span>{{ t('index.start_sending') }}</span>
          </button>
        </div>
        <div
          v-if="selectedFile !== null"
          class="bg-neutral-700 mt-4 mx-4 p-2 rounded">
          <table>
            <tbody>
              <tr>
                <th class="text-left pr-4 whitespace-nowrap">
                  {{ t('index.file_name') }}
                </th>
                <td class="break-all">{{ selectedFile.name }}</td>
              </tr>
              <tr>
                <th class="text-left pr-4 whitespace-nowrap">
                  {{ t('index.file_size') }}
                </th>
                <td :title="selectedFile.size.toString() + ' Byte(s)'">
                  {{ selectedFileSize }}
                </td>
              </tr>
              <tr>
                <th class="text-left pr-4 whitespace-nowrap">
                  {{ t('index.status') }}
                </th>
                <td></td>
              </tr>
              <tr>
                <th class="text-left pr-4 whitespace-nowrap">
                  {{ t('index.receive_code') }}
                </th>
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
