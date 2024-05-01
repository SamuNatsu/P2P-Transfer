<script lang="ts" setup>
// Stores
import { useStore } from '@/stores';
import { useSendFileStore } from '@/stores/send-file';

// Icons
import MdiArrowBackCircle from '~icons/mdi/arrow-back-circle';
import MdiRocketLaunchOutline from '~icons/mdi/rocket-launch-outline';
import MdiStopRemoveOutline from '~icons/mdi/stop-remove-outline';

// Injects
const { status: mainStatus } = useStore();
const { status, interrupt, start } = useSendFileStore();
</script>

<template>
  <div class="flex flex-wrap gap-4 items-center justify-center mx-4">
    <button
      v-if="['idle', 'finished', 'failed', 'interrupted'].includes(status)"
      @click="mainStatus = 'home'"
      class="bg-red-500 flex gap-2 items-center px-4 py-2 rounded hover:bg-red-400">
      <MdiArrowBackCircle class="text-2xl" />
      <span>{{ $t('btn.back') }}</span>
    </button>
    <button
      v-if="status === 'idle'"
      @click="start"
      class="bg-cyan-500 flex gap-2 items-center px-4 py-2 rounded hover:bg-cyan-600">
      <MdiRocketLaunchOutline class="text-2xl" />
      <span>{{ $t('btn.start_sending') }}</span>
    </button>
    <button
      v-if="!['idle', 'finished', 'failed', 'interrupted'].includes(status)"
      @click="interrupt"
      class="bg-yellow-500 flex gap-2 items-center px-4 py-2 rounded hover:bg-yellow-600">
      <MdiStopRemoveOutline class="text-2xl" />
      <span>{{ $t('btn.interrupt') }}</span>
    </button>
  </div>
</template>
