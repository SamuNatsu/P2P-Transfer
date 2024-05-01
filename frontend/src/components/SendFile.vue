<script lang="ts" setup>
import { onBeforeUnmount } from 'vue';

// Stores
import { useSendFileStore } from '@/stores/send-file';

// Components
import SenderController from '@/components/sender/SenderController.vue';
import SenderPanel from '@/components/sender/SenderPanel.vue';

// Injects
const { resetStore } = useSendFileStore();

// Hooks
onBeforeUnmount((): void => {
  resetStore();
});
</script>

<template>
  <div>
    <SenderController />
    <SenderPanel />
  </div>
</template>
