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
  <div class="flex flex-col gap-8">
    <AppButton label="Send" variant="info" @click="router.push('/send')">
      <template #icon>
        <MdiFileUpload class="text-2xl" />
      </template>
    </AppButton>
    <AppButton label="Receive" variant="info" @click="router.push('/receive')">
      <template #icon>
        <MdiFileDownload class="text-2xl" />
      </template>
    </AppButton>
  </div>
</template>
