<script setup lang="ts">
import { checkWebRTC } from '@/utils';
import { onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';

/* Icons */
import MdiFileDownload from '~icons/mdi/file-download';
import MdiFileUpload from '~icons/mdi/file-upload';

/* Components */
import AppButton from '@/components/AppButton.vue';

/* Services */
const router = useRouter();

/* Reactive */
const support = ref(true);

/* Hooks */
onBeforeMount(() => {
  setTimeout(() => {
    support.value = checkWebRTC();
  });
});
</script>

<template>
  <div class="flex flex-col items-center gap-8">
    <p v-if="!support" class="bg-red-800 font-bold px-4 py-2 rounded">
      WebRTC not supported
    </p>
    <div class="flex flex-col gap-8">
      <AppButton
        label="Send"
        variant="info"
        :disabled="!support"
        @click="router.push('/send')"
      >
        <template #icon>
          <MdiFileUpload class="text-2xl" />
        </template>
      </AppButton>
      <AppButton
        label="Receive"
        variant="info"
        :disabled="!support"
        @click="router.push('/receive')"
      >
        <template #icon>
          <MdiFileDownload class="text-2xl" />
        </template>
      </AppButton>
    </div>
  </div>
</template>
