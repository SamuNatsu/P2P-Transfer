<script setup lang="ts">
import { useSender } from '@/stores/sender';
import { onBeforeMount, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

/* Icons */
import MdiArrowBack from '~icons/mdi/arrow-back';
import MdiRocketLaunchOutline from '~icons/mdi/rocket-launch-outline';
import MdiStopRemoveOutline from '~icons/mdi/stop-remove-outline';

/* Components */
import AppButton from '@/components/AppButton.vue';
import FileDropZone from '@/components/FileDropZone.vue';
import SenderPanel from '@/components/SenderPanel.vue';

/* Services */
const router = useRouter();

/* Stores */
const { state, file, reset, clearEffect, start, abort } = useSender();

/* Hooks */
onBeforeMount(() => reset());
onBeforeUnmount(() => clearEffect());
</script>

<template>
  <div class="flex flex-col gap-4 items-center">
    <!-- File selection -->
    <section
      v-if="state === 'file-sel'"
      class="flex flex-col gap-4 items-center"
    >
      <FileDropZone v-model:file="file" />
      <div class="flex gap-4 mt-8">
        <AppButton label="Back" variant="error" @click="router.push('/')">
          <template #icon>
            <MdiArrowBack class="text-2xl" />
          </template>
        </AppButton>
        <AppButton
          label="Start"
          variant="success"
          :disabled="file === null"
          @click="start()"
        >
          <template #icon>
            <MdiRocketLaunchOutline class="text-2xl" />
          </template>
        </AppButton>
      </div>
    </section>

    <!-- File sending -->
    <section v-else class="flex flex-col gap-4 items-center">
      <SenderPanel />
      <div class="flex gap-4 mt-8">
        <AppButton
          v-if="['done', 'error'].includes(state)"
          label="Back"
          variant="error"
          @click="router.push('/')"
        >
          <template #icon>
            <MdiArrowBack class="text-2xl" />
          </template>
        </AppButton>
        <AppButton v-else label="Abort" variant="error" @click="abort">
          <template #icon>
            <MdiStopRemoveOutline class="text-2xl" />
          </template>
        </AppButton>
      </div>
    </section>
  </div>
</template>
