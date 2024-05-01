<script lang="ts" setup>
// Stores
import { useStore } from '@/stores';
import { useRecvFileStore } from '@/stores/recv-file';

// Icons
import MdiArrowBackCircle from '~icons/mdi/arrow-back-circle';
import MdiContentSave from '~icons/mdi/content-save';
import MdiStopRemoveOutline from '~icons/mdi/stop-remove-outline';

// Properties
defineProps<{
  canSave: boolean;
}>();

// Emits
defineEmits<{
  save: [];
}>();

// Injects
const { status: mainStatus } = useStore();
const { status, interrupt } = useRecvFileStore();
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
      v-if="!['idle', 'finished', 'failed', 'interrupted'].includes(status)"
      @click="interrupt"
      class="bg-yellow-500 flex gap-2 items-center px-4 py-2 rounded hover:bg-yellow-600">
      <MdiStopRemoveOutline class="text-2xl" />
      <span>{{ $t('btn.interrupt') }}</span>
    </button>
    <button
      v-if="canSave"
      @click="$emit('save')"
      class="bg-green-500 flex gap-2 items-center px-4 py-2 rounded hover:bg-green-600">
      <MdiContentSave class="text-2xl" />
      <span>{{ $t('btn.save_file') }}</span>
    </button>
  </div>
</template>
