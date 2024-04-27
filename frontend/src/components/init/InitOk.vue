<script lang="ts" setup>
// Stores
import { useStore } from '@/stores';
import { useSendFileStore } from '@/stores/send-file';

// Icons
import MdiCloudDownloadOutline from '~icons/mdi/cloud-download-outline';
import MdiCloudUploadOutline from '~icons/mdi/cloud-upload-outline';

// Components
import SendFile from '@/components/SendFile.vue';

// Inject
const { mode } = useStore();
const { resetStore, selectFile } = useSendFileStore();

// Action
const toSendFileMode = (): void => {
  resetStore();
  selectFile();
};
</script>

<template>
  <div class="flex flex-col items-center justify-center mt-4">
    <div class="bg-green-600 py-2 text-center w-screen">
      {{ $t('index.server_connected') }}
    </div>
    <div
      v-if="mode === null"
      class="flex flex-wrap gap-4 items-center justify-center mt-8 mx-4">
      <button
        @click="toSendFileMode"
        class="bg-blue-500 flex gap-2 items-center p-2 rounded hover:bg-blue-600">
        <MdiCloudUploadOutline class="text-2xl" />
        <span>{{ $t('index.send_file') }}</span>
      </button>
      <button
        class="bg-orange-500 flex gap-2 items-center p-2 rounded hover:bg-orange-400">
        <MdiCloudDownloadOutline class="text-2xl" />
        <span>{{ $t('index.receive_file') }}</span>
      </button>
    </div>
    <SendFile v-else-if="mode === 'send'" />
  </div>
</template>
