<script setup lang="ts">
import { useRouter } from 'vue-router';

/* Icons */
import MdiFileDownload from '~icons/mdi/file-download';
import MdiFileUpload from '~icons/mdi/file-upload';

/* Components */
import AppButton from '@/components/AppButton.vue';

/* Services */
const router = useRouter();
</script>

<template>
  <div class="flex flex-col gap-4">
    <AppButton label="Upload" variant="info" @click="router.push('/upload')">
      <template #icon>
        <MdiFileUpload class="text-2xl" />
      </template>
    </AppButton>
    <AppButton label="Download" variant="info" @click="router.push('/download')">
      <template #icon>
        <MdiFileDownload class="text-2xl" />
      </template>
    </AppButton>
  </div>
</template>
