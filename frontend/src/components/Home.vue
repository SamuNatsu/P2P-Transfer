<script lang="ts" setup>
// Stores
import { useStore } from '@/stores';
import { useSendFileStore } from '@/stores/send-file';

// Icons
import MdiCloudDownloadOutline from '~icons/mdi/cloud-download-outline';
import MdiCloudUploadOutline from '~icons/mdi/cloud-upload-outline';

// Inject
const { status } = useStore();
const { selectFile } = useSendFileStore();
</script>

<template>
  <div class="fixed flex inset-0 items-center justify-center p-8 -z-50">
    <div class="flex flex-col gap-8">
      <button
        @click="selectFile"
        class="bg-blue-500 flex gap-2 items-center px-4 py-2 rounded hover:bg-blue-600">
        <MdiCloudUploadOutline class="text-4xl" />
        <span class="font-bold">{{ $t('btn.send_file') }}</span>
      </button>
      <button
        @click="status = 'receive'"
        class="bg-orange-500 flex gap-2 items-center px-4 py-2 rounded hover:bg-orange-400">
        <MdiCloudDownloadOutline class="text-4xl" />
        <span class="font-bold">{{ $t('btn.receive_file') }}</span>
      </button>
    </div>
  </div>
</template>
